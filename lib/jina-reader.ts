import axios from 'axios';

export interface JinaReaderResponse {
  code: number;
  status: number;
  data: {
    title: string;
    description: string;
    url: string;
    content: string;
    usage: {
      tokens: number;
    };
  };
}

export interface ExtractedContent {
  title: string;
  description: string;
  content: string;
  wordCount: number;
  url?: string;
}

class JinaReader {
  private apiKey: string;
  private baseUrl = 'https://r.jina.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Extract content from a URL using Jina AI Reader (via server-side API)
   */
  async extractFromURL(url: string): Promise<ExtractedContent> {
    try {
      console.log('Extracting content from URL using Jina AI:', url);

      const response = await axios.get(`/api/jina`, {
        params: { url },
        timeout: 30000 // 30 second timeout
      });

      if (response.status !== 200) {
        throw new Error(`Jina AI Reader failed with status ${response.status}`);
      }

      const { data } = response.data;
      
      if (!data || !data.content || data.content.trim().length === 0) {
        throw new Error('No content could be extracted from this URL');
      }

      console.log('Jina AI extraction successful:', {
        title: data.title?.substring(0, 50) + '...',
        contentLength: data.content.length,
        wordCount: data.wordCount
      });

      return {
        title: data.title,
        description: data.description,
        content: data.content,
        wordCount: data.wordCount,
        url: data.url
      };

    } catch (error) {
      console.error('Jina AI Reader error:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(errorMessage);
      }

      throw new Error(`Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract content from a PDF file using Jina AI Reader (via server-side API)
   */
  async extractFromPDF(file: File): Promise<ExtractedContent> {
    try {
      console.log('Extracting content from PDF using Jina AI:', file.name);

      // Validate file type
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Only PDF files are supported for upload');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Use our server-side API to avoid CORS issues
      const response = await axios.post('/api/jina', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 second timeout for PDF processing
      });

      if (response.status !== 200) {
        throw new Error(`Jina AI Reader failed with status ${response.status}`);
      }

      const { data } = response.data;
      
      if (!data || !data.content || data.content.trim().length === 0) {
        throw new Error('No content could be extracted from this PDF. It might be image-based or encrypted.');
      }

      console.log('Jina AI PDF extraction successful:', {
        filename: data.filename,
        contentLength: data.content.length,
        wordCount: data.wordCount
      });

      return {
        title: data.title,
        description: data.description,
        content: data.content,
        wordCount: data.wordCount
      };

    } catch (error) {
      console.error('Jina AI PDF Reader error:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(errorMessage);
      }

      throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  /**
   * Check if URL is valid for processing
   */
  isValidURL(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }
}

// Create singleton instance with API key
export const jinaReader = new JinaReader(process.env.JINA_API_KEY || 'jina_921018daa27142e8b5988b377227cc5003wnqysJwfT7LdK8hYgz0eGQ_QKN');

export default JinaReader;