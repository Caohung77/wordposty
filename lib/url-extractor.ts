import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ExtractedContent {
  url: string;
  title: string;
  content: string;
  description: string;
  wordCount: number;
  publishDate?: string;
  author?: string;
  tags?: string[];
  error?: string;
}

export interface URLExtractionResult {
  success: boolean;
  content: ExtractedContent[];
  errors: string[];
}

class URLExtractor {
  private readonly timeout = 30000; // 30 seconds
  private readonly maxContentLength = 50000; // 50KB of text content
  
  async extractFromURLs(urls: string[]): Promise<URLExtractionResult> {
    const result: URLExtractionResult = {
      success: true,
      content: [],
      errors: []
    };

    for (const url of urls) {
      try {
        const extracted = await this.extractFromURL(url);
        result.content.push(extracted);
      } catch (error) {
        const errorMessage = `Failed to extract from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        result.success = false;
      }
    }

    return result;
  }

  private async extractFromURL(url: string): Promise<ExtractedContent> {
    // Validate URL
    this.validateURL(url);

    try {
      // Fetch the webpage
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        maxRedirects: 5
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract content using multiple strategies
      const extracted = this.extractContentFromHTML($, url);
      
      // Validate extracted content
      if (!extracted.content.trim()) {
        throw new Error('No readable content found on the page');
      }

      return extracted;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - page took too long to load');
        }
        if (error.response?.status === 404) {
          throw new Error('Page not found (404)');
        }
        if (error.response?.status === 403) {
          throw new Error('Access forbidden (403) - site may block automated requests');
        }
        if (error.response?.status >= 500) {
          throw new Error('Server error - please try again later');
        }
      }
      
      throw error;
    }
  }

  private validateURL(url: string): void {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported');
      }
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  private extractContentFromHTML($: cheerio.CheerioAPI, url: string): ExtractedContent {
    // Try to extract title
    const title = this.extractTitle($);
    
    // Try to extract description
    const description = this.extractDescription($);
    
    // Try to extract main content
    const content = this.extractMainContent($);
    
    // Try to extract metadata
    const metadata = this.extractMetadata($);
    
    // Clean and limit content
    const cleanContent = this.cleanContent(content);
    const limitedContent = cleanContent.length > this.maxContentLength 
      ? cleanContent.substring(0, this.maxContentLength) + '...'
      : cleanContent;

    return {
      url,
      title,
      content: limitedContent,
      description,
      wordCount: this.countWords(limitedContent),
      publishDate: metadata.publishDate,
      author: metadata.author,
      tags: metadata.tags
    };
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    // Try multiple selectors for title
    const selectors = [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'h1',
      'title',
      '.entry-title',
      '.post-title',
      '.article-title'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = selector.startsWith('meta') 
          ? element.attr('content') 
          : element.text();
        
        if (text && text.trim()) {
          return text.trim();
        }
      }
    }

    return 'Untitled Article';
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    // Try multiple selectors for description
    const selectors = [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
      '.excerpt',
      '.summary',
      '.lead'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = selector.startsWith('meta') 
          ? element.attr('content') 
          : element.text();
        
        if (text && text.trim()) {
          return text.trim();
        }
      }
    }

    return '';
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .sidebar, .menu, .navigation, .comments, .social-share').remove();
    
    // Try multiple selectors for main content
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.entry-content',
      '.post-content',
      '.article-content',
      '.content',
      'main',
      '.main-content',
      '#content',
      '.post-body',
      '.article-body'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text();
        if (text && text.trim().length > 200) {
          return text;
        }
      }
    }

    // Fallback: extract from body, removing obvious non-content
    $('header, footer, nav, aside, .header, .footer, .sidebar, .menu, .comments').remove();
    return $('body').text() || '';
  }

  private extractMetadata($: cheerio.CheerioAPI): {
    publishDate?: string;
    author?: string;
    tags?: string[];
  } {
    const metadata: { publishDate?: string; author?: string; tags?: string[] } = {};

    // Extract publish date
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'time[datetime]',
      '.published',
      '.date'
    ];

    for (const selector of dateSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const date = selector.includes('meta') 
          ? element.attr('content')
          : (element.attr('datetime') || element.text());
        
        if (date) {
          metadata.publishDate = date.trim();
          break;
        }
      }
    }

    // Extract author
    const authorSelectors = [
      'meta[property="article:author"]',
      'meta[name="author"]',
      '.author',
      '.byline',
      '[rel="author"]'
    ];

    for (const selector of authorSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const author = selector.includes('meta') 
          ? element.attr('content')
          : element.text();
        
        if (author) {
          metadata.author = author.trim();
          break;
        }
      }
    }

    // Extract tags
    const tags: string[] = [];
    $('meta[property="article:tag"], .tags a, .tag, .category').each((_, el) => {
      const tag = $(el).attr('content') || $(el).text();
      if (tag && tag.trim()) {
        tags.push(tag.trim());
      }
    });

    if (tags.length > 0) {
      metadata.tags = [...new Set(tags)]; // Remove duplicates
    }

    return metadata;
  }

  private cleanContent(content: string): string {
    return content
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters but keep basic punctuation
      .replace(/[^\w\s.,!?;:()\-"']/g, '')
      // Normalize line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  private countWords(text: string): number {
    return text
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  // Static method for quick extraction from single URL
  static async extractFromURL(url: string): Promise<ExtractedContent> {
    const extractor = new URLExtractor();
    const result = await extractor.extractFromURLs([url]);
    
    if (!result.success || result.content.length === 0) {
      throw new Error(result.errors.join('; '));
    }

    return result.content[0];
  }

  // Validate URL format
  static isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
}

export const urlExtractor = new URLExtractor();
export default URLExtractor;