import { fileProcessor, ProcessedFile } from './file-processor';
import { urlExtractor, ExtractedContent } from './url-extractor';

export interface SourceInput {
  id: string;
  type: 'text' | 'url' | 'file';
  content: string; // For text type, this is the raw text; for URL, this is the URL; for file, this is file name
  file?: File; // Only for file type
}

export interface ProcessedSource {
  id: string;
  type: 'text' | 'url' | 'file';
  title: string;
  content: string;
  wordCount: number;
  metadata?: {
    url?: string;
    fileName?: string;
    fileSize?: number;
    author?: string;
    publishDate?: string;
    tags?: string[];
  };
  error?: string;
}

export interface SourceAnalysisInput {
  sources: ProcessedSource[];
  topic: string;
  targetAudience?: string;
}

export interface SourceProcessingResult {
  success: boolean;
  sources: ProcessedSource[];
  errors: string[];
  totalWordCount: number;
}

class SourceManager {
  async processSources(inputs: SourceInput[]): Promise<SourceProcessingResult> {
    const result: SourceProcessingResult = {
      success: true,
      sources: [],
      errors: [],
      totalWordCount: 0
    };

    for (const input of inputs) {
      try {
        const processedSource = await this.processSource(input);
        result.sources.push(processedSource);
        result.totalWordCount += processedSource.wordCount;
      } catch (error) {
        const errorMessage = `Failed to process ${input.type} source (${input.id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        result.success = false;
      }
    }

    // Validate total content
    if (result.sources.length === 0) {
      result.errors.push('No sources were successfully processed');
      result.success = false;
    }

    return result;
  }

  private async processSource(input: SourceInput): Promise<ProcessedSource> {
    switch (input.type) {
      case 'text':
        return this.processTextSource(input);
      
      case 'url':
        return await this.processURLSource(input);
      
      case 'file':
        return await this.processFileSource(input);
      
      default:
        throw new Error(`Unsupported source type: ${(input as any).type}`);
    }
  }

  private processTextSource(input: SourceInput): ProcessedSource {
    const content = input.content.trim();
    
    if (!content) {
      throw new Error('Text source is empty');
    }

    // Extract title from first line or first sentence
    const title = this.extractTitleFromText(content);
    
    return {
      id: input.id,
      type: 'text',
      title,
      content,
      wordCount: this.countWords(content)
    };
  }

  private async processURLSource(input: SourceInput): Promise<ProcessedSource> {
    const url = input.content.trim();
    
    if (!urlExtractor.constructor.isValidURL(url)) {
      throw new Error('Invalid URL format');
    }

    const extracted = await urlExtractor.extractFromURLs([url]);
    
    if (!extracted.success || extracted.content.length === 0) {
      throw new Error(`Failed to extract content from URL: ${extracted.errors.join('; ')}`);
    }

    const urlContent = extracted.content[0];
    
    return {
      id: input.id,
      type: 'url',
      title: urlContent.title,
      content: urlContent.content,
      wordCount: urlContent.wordCount,
      metadata: {
        url: urlContent.url,
        author: urlContent.author,
        publishDate: urlContent.publishDate,
        tags: urlContent.tags
      }
    };
  }

  private async processFileSource(input: SourceInput): Promise<ProcessedSource> {
    if (!input.file) {
      throw new Error('File source missing file data');
    }

    const result = await fileProcessor.processFiles([input.file]);
    
    if (!result.success || result.files.length === 0) {
      throw new Error(`Failed to process file: ${result.errors.join('; ')}`);
    }

    const processedFile = result.files[0];
    
    // Extract title from filename or content
    const title = this.extractTitleFromFile(processedFile);
    
    return {
      id: input.id,
      type: 'file',
      title,
      content: processedFile.content,
      wordCount: processedFile.wordCount,
      metadata: {
        fileName: processedFile.name,
        fileSize: processedFile.size
      }
    };
  }

  private extractTitleFromText(content: string): string {
    // Try to extract title from first line
    const firstLine = content.split('\n')[0].trim();
    
    if (firstLine.length > 0 && firstLine.length <= 100) {
      return firstLine;
    }

    // Fallback: use first sentence up to 100 chars
    const firstSentence = content.split('.')[0].trim();
    
    if (firstSentence.length > 0 && firstSentence.length <= 100) {
      return firstSentence;
    }

    // Fallback: use first 50 characters
    return content.substring(0, 50).trim() + (content.length > 50 ? '...' : '');
  }

  private extractTitleFromFile(file: ProcessedFile): string {
    // Use filename without extension as base title
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    
    // If filename is descriptive, use it
    if (nameWithoutExt.length > 3 && nameWithoutExt.length <= 50) {
      return nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Otherwise extract from content
    return this.extractTitleFromText(file.content);
  }

  private countWords(text: string): number {
    return text
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  // Prepare sources for Perplexity analysis
  prepareForAnalysis(sources: ProcessedSource[], topic: string, targetAudience?: string): SourceAnalysisInput {
    return {
      sources,
      topic,
      targetAudience
    };
  }

  // Format sources as text for Perplexity prompt
  formatSourcesForPrompt(sources: ProcessedSource[]): string {
    return sources.map((source, index) => {
      let formatted = `SOURCE ${index + 1} - ${source.title} (${source.type.toUpperCase()}):\n`;
      
      if (source.metadata?.url) {
        formatted += `URL: ${source.metadata.url}\n`;
      }
      
      if (source.metadata?.author) {
        formatted += `Author: ${source.metadata.author}\n`;
      }
      
      if (source.metadata?.publishDate) {
        formatted += `Published: ${source.metadata.publishDate}\n`;
      }
      
      formatted += `Content:\n${source.content}\n`;
      
      return formatted;
    }).join('\n---\n\n');
  }

  // Get source summary for UI
  getSourcesSummary(sources: ProcessedSource[]): {
    totalSources: number;
    totalWords: number;
    byType: Record<string, number>;
  } {
    const summary = {
      totalSources: sources.length,
      totalWords: sources.reduce((sum, source) => sum + source.wordCount, 0),
      byType: {} as Record<string, number>
    };

    sources.forEach(source => {
      summary.byType[source.type] = (summary.byType[source.type] || 0) + 1;
    });

    return summary;
  }

  // Validate sources before analysis
  validateSourcesForAnalysis(sources: ProcessedSource[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (sources.length === 0) {
      errors.push('No sources provided for analysis');
    }

    const totalWords = sources.reduce((sum, source) => sum + source.wordCount, 0);
    
    if (totalWords < 50) {
      errors.push('Total word count too low (minimum 50 words required)');
    }

    if (totalWords > 20000) {
      errors.push('Total word count too high (maximum 20,000 words allowed)');
    }

    // Check for sources with errors
    const sourcesWithErrors = sources.filter(source => source.error);
    if (sourcesWithErrors.length > 0) {
      errors.push(`${sourcesWithErrors.length} sources have processing errors`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const sourceManager = new SourceManager();
export default SourceManager;