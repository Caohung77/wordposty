import axios, { AxiosInstance } from 'axios';
import { BlogGeneration } from './claude';

export interface WordPressCredentials {
  url: string;
  username: string;
  password: string; // App Password
}

export interface WordPressPost {
  id?: number;
  title: {
    rendered?: string;
    raw: string;
  };
  content: {
    rendered?: string;
    raw: string;
  };
  excerpt: {
    rendered?: string;
    raw: string;
  };
  status: 'draft' | 'pending' | 'private' | 'publish' | 'future';
  slug?: string;
  author?: number;
  featured_media?: number;
  comment_status?: 'open' | 'closed';
  ping_status?: 'open' | 'closed';
  sticky?: boolean;
  template?: string;
  format?: string;
  meta?: Record<string, any>;
  categories?: number[];
  tags?: number[];
  date?: string;
  date_gmt?: string;
  modified?: string;
  modified_gmt?: string;
  link?: string;
  guid?: {
    rendered: string;
  };
  
  // SEO fields (if using Yoast or similar)
  yoast_head?: string;
  yoast_head_json?: {
    title?: string;
    description?: string;
    robots?: Record<string, any>;
    og_title?: string;
    og_description?: string;
    og_image?: any[];
    twitter_card?: string;
    twitter_title?: string;
    twitter_description?: string;
    twitter_image?: string;
  };
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: any[];
}

export interface WordPressTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  meta: any[];
}

export interface WordPressMedia {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  author: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: any[];
  description: {
    rendered: string;
  };
  caption: {
    rendered: string;
  };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: Record<string, any>;
    image_meta: Record<string, any>;
  };
  source_url: string;
}

export interface PublishOptions {
  status: WordPressPost['status'];
  scheduledDate?: string;
  categories?: string[];
  tags?: string[];
  featuredImageUrl?: string;
  allowComments?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface PublishResult {
  success: boolean;
  post?: WordPressPost;
  url?: string;
  error?: string;
  warnings?: string[];
}

class WordPressService {
  private client: AxiosInstance;
  private credentials: WordPressCredentials;

  constructor(credentials: WordPressCredentials) {
    this.credentials = credentials;
    
    // Ensure URL has proper format
    const baseURL = credentials.url.endsWith('/') 
      ? `${credentials.url}wp-json/wp/v2/`
      : `${credentials.url}/wp-json/wp/v2/`;

    this.client = axios.create({
      baseURL,
      auth: {
        username: credentials.username,
        password: credentials.password
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WordPosty-AI-Agent/1.0'
      },
      timeout: 30000
    });
  }

  // Test connection to WordPress site
  async testConnection(): Promise<{ success: boolean; error?: string; siteInfo?: any }> {
    try {
      // Test basic API access
      const response = await this.client.get('');
      
      // Get site info
      const siteResponse = await this.client.get('settings', {
        auth: {
          username: this.credentials.username,
          password: this.credentials.password
        }
      });

      return {
        success: true,
        siteInfo: {
          name: siteResponse.data.title,
          description: siteResponse.data.description,
          url: siteResponse.data.url,
          timezone: siteResponse.data.timezone,
          dateFormat: siteResponse.data.date_format,
          timeFormat: siteResponse.data.time_format,
          language: siteResponse.data.language
        }
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'Authentication failed. Check username and app password.' };
        }
        if (error.response?.status === 403) {
          return { success: false, error: 'Access forbidden. User may not have sufficient permissions.' };
        }
        if (error.response?.status === 404) {
          return { success: false, error: 'WordPress REST API not found. Check if site URL is correct.' };
        }
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      };
    }
  }

  // Publish blog post to WordPress
  async publishPost(
    blogGeneration: BlogGeneration,
    options: PublishOptions = { status: 'draft' }
  ): Promise<PublishResult> {
    try {
      const warnings: string[] = [];

      // Prepare categories
      let categoryIds: number[] = [];
      if (options.categories && options.categories.length > 0) {
        categoryIds = await this.getOrCreateCategories(options.categories);
      }

      // Prepare tags
      let tagIds: number[] = [];
      if (options.tags && options.tags.length > 0) {
        tagIds = await this.getOrCreateTags(options.tags);
      }

      // Handle featured image
      let featuredMediaId: number | undefined;
      if (options.featuredImageUrl) {
        try {
          featuredMediaId = await this.uploadFeaturedImage(
            options.featuredImageUrl,
            blogGeneration.title
          );
        } catch (error) {
          warnings.push(`Failed to upload featured image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Prepare post data
      const postData: Partial<WordPressPost> = {
        title: {
          raw: options.seoTitle || blogGeneration.title
        },
        content: {
          raw: blogGeneration.content
        },
        excerpt: {
          raw: blogGeneration.excerpt
        },
        status: options.status,
        comment_status: options.allowComments ? 'open' : 'closed',
        ping_status: 'closed',
        categories: categoryIds.length > 0 ? categoryIds : undefined,
        tags: tagIds.length > 0 ? tagIds : undefined,
        featured_media: featuredMediaId,
        meta: {
          // SEO metadata (compatible with Yoast SEO)
          _yoast_wpseo_title: options.seoTitle || blogGeneration.title,
          _yoast_wpseo_metadesc: options.seoDescription || blogGeneration.metaDescription,
          _yoast_wpseo_focuskw: blogGeneration.tags?.[0] || '',
          
          // Custom fields for WordPosty
          _wordposty_generated: true,
          _wordposty_seo_score: blogGeneration.seoScore,
          _wordposty_generation_date: new Date().toISOString()
        }
      };

      // Handle scheduled publishing
      if (options.status === 'future' && options.scheduledDate) {
        postData.date = options.scheduledDate;
      }

      // Create the post
      const response = await this.client.post('posts', postData);
      const createdPost = response.data as WordPressPost;

      return {
        success: true,
        post: createdPost,
        url: createdPost.link,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('WordPress publish error:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        return {
          success: false,
          error: `WordPress API Error: ${errorMessage}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown publishing error'
      };
    }
  }

  // Get or create categories
  private async getOrCreateCategories(categoryNames: string[]): Promise<number[]> {
    const categoryIds: number[] = [];

    for (const categoryName of categoryNames) {
      try {
        // Search for existing category
        const searchResponse = await this.client.get('categories', {
          params: { search: categoryName, per_page: 100 }
        });

        const existingCategory = searchResponse.data.find(
          (cat: WordPressCategory) => cat.name.toLowerCase() === categoryName.toLowerCase()
        );

        if (existingCategory) {
          categoryIds.push(existingCategory.id);
        } else {
          // Create new category
          const createResponse = await this.client.post('categories', {
            name: categoryName,
            slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          });
          categoryIds.push(createResponse.data.id);
        }
      } catch (error) {
        console.warn(`Failed to process category "${categoryName}":`, error);
      }
    }

    return categoryIds;
  }

  // Get or create tags
  private async getOrCreateTags(tagNames: string[]): Promise<number[]> {
    const tagIds: number[] = [];

    for (const tagName of tagNames) {
      try {
        // Search for existing tag
        const searchResponse = await this.client.get('tags', {
          params: { search: tagName, per_page: 100 }
        });

        const existingTag = searchResponse.data.find(
          (tag: WordPressTag) => tag.name.toLowerCase() === tagName.toLowerCase()
        );

        if (existingTag) {
          tagIds.push(existingTag.id);
        } else {
          // Create new tag
          const createResponse = await this.client.post('tags', {
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          });
          tagIds.push(createResponse.data.id);
        }
      } catch (error) {
        console.warn(`Failed to process tag "${tagName}":`, error);
      }
    }

    return tagIds;
  }

  // Upload featured image
  private async uploadFeaturedImage(imageUrl: string, postTitle: string): Promise<number> {
    try {
      // Download image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000
      });

      const imageBuffer = Buffer.from(imageResponse.data);
      
      // Determine file extension
      const contentType = imageResponse.headers['content-type'];
      let extension = 'jpg';
      if (contentType?.includes('png')) extension = 'png';
      if (contentType?.includes('gif')) extension = 'gif';
      if (contentType?.includes('webp')) extension = 'webp';

      const filename = `${postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${extension}`;

      // Upload to WordPress
      const uploadResponse = await this.client.post('media', imageBuffer, {
        headers: {
          'Content-Type': contentType || 'image/jpeg',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });

      return uploadResponse.data.id;
    } catch (error) {
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get existing categories
  async getCategories(): Promise<WordPressCategory[]> {
    try {
      const response = await this.client.get('categories', {
        params: { per_page: 100, orderby: 'name', order: 'asc' }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  }

  // Get existing tags
  async getTags(): Promise<WordPressTag[]> {
    try {
      const response = await this.client.get('tags', {
        params: { per_page: 100, orderby: 'name', order: 'asc' }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      return [];
    }
  }

  // Get recent posts
  async getPosts(limit: number = 10): Promise<WordPressPost[]> {
    try {
      const response = await this.client.get('posts', {
        params: { per_page: limit, orderby: 'date', order: 'desc' }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      return [];
    }
  }
}

// Factory function to create WordPress service
export function createWordPressService(credentials?: WordPressCredentials): WordPressService {
  const creds = credentials || {
    url: process.env.WORDPRESS_API_URL || '',
    username: process.env.WORDPRESS_USERNAME || '',
    password: process.env.WORDPRESS_APP_PASSWORD || ''
  };

  if (!creds.url || !creds.username || !creds.password) {
    throw new Error('WordPress credentials are incomplete. Check environment variables.');
  }

  return new WordPressService(creds);
}

// Default service instance
export const wordpressService = createWordPressService();
export default WordPressService;