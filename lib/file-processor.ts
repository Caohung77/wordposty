// import pdf from 'pdf-parse'; // Temporarily disabled - using Jina AI instead

export interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  wordCount: number;
  error?: string;
}

export interface FileProcessingResult {
  success: boolean;
  files: ProcessedFile[];
  errors: string[];
}

class FileProcessor {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/msword', // DOC
  ];

  async processFiles(files: File[]): Promise<FileProcessingResult> {
    const result: FileProcessingResult = {
      success: true,
      files: [],
      errors: []
    };

    for (const file of files) {
      try {
        const processedFile = await this.processFile(file);
        result.files.push(processedFile);
      } catch (error) {
        const errorMessage = `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        result.success = false;
      }
    }

    return result;
  }

  private async processFile(file: File): Promise<ProcessedFile> {
    // Validate file
    this.validateFile(file);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let content = '';

    switch (file.type) {
      case 'application/pdf':
        content = await this.processPDF(buffer);
        break;
      case 'text/plain':
      case 'text/markdown':
        content = await this.processText(buffer);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        content = await this.processWord(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Clean and validate content
    content = this.cleanContent(content);
    
    if (!content.trim()) {
      throw new Error('No readable content found in file');
    }

    return {
      name: file.name,
      type: file.type,
      size: file.size,
      content,
      wordCount: this.countWords(content)
    };
  }

  private validateFile(file: File): void {
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds limit (${this.maxFileSize / 1024 / 1024}MB)`);
    }

    if (!this.allowedTypes.includes(file.type)) {
      throw new Error(`File type not supported: ${file.type}`);
    }
  }

  private async processPDF(buffer: Buffer): Promise<string> {
    // PDF processing now handled by Jina AI - this method is deprecated
    throw new Error('PDF processing via file upload is temporarily disabled. Please use URL-based PDF processing instead.');
  }

  private async processText(buffer: Buffer): Promise<string> {
    try {
      return buffer.toString('utf-8');
    } catch (error) {
      throw new Error(`Text processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processWord(buffer: Buffer): Promise<string> {
    // For now, we'll return an error message for Word documents
    // In a production environment, you'd use a library like mammoth
    throw new Error('Word document processing not yet implemented. Please convert to PDF or text format.');
  }

  private cleanContent(content: string): string {
    try {
      return content
        // Normalize line breaks first
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove excessive line breaks
        .replace(/\n{3,}/g, '\n\n')
        // Remove control characters but keep basic ones
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Trim
        .trim();
    } catch (error) {
      // If regex fails, return cleaned content without regex
      console.warn('Content cleaning regex failed, returning basic clean:', error);
      return content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
    }
  }

  private countWords(text: string): number {
    return text
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  // Static method for quick text extraction from single file
  static async extractText(file: File): Promise<string> {
    const processor = new FileProcessor();
    const result = await processor.processFiles([file]);
    
    if (!result.success || result.files.length === 0) {
      throw new Error(result.errors.join('; '));
    }

    return result.files[0].content;
  }

  // Get supported file extensions for UI
  static getSupportedExtensions(): string[] {
    return ['.pdf', '.txt', '.md'];
  }

  // Get max file size for UI
  static getMaxFileSize(): number {
    return 10 * 1024 * 1024; // 10MB
  }
}

export const fileProcessor = new FileProcessor();
export default FileProcessor;