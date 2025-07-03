import Anthropic from '@anthropic-ai/sdk';
import { SourceAnalysis } from './perplexity';
import { promptTemplateManager } from './prompt-templates';

export interface BlogGeneration {
  title: string;
  content: string;
  metaDescription: string;
  tags: string[];
  seoScore: number;
  excerpt: string;
}

export interface ClaudeRequest {
  sourceAnalysis: SourceAnalysis;
  topic: string;
  wordCount: number;
  tone: string;
  targetAudience?: string;
  customPrompt?: string;
}

class ClaudeService {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async generateBlogPost(request: ClaudeRequest): Promise<BlogGeneration> {
    try {
      const prompt = this.buildBlogPrompt(request);
      
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        system: 'You are a professional blogger with 10+ years of experience writing engaging, human-like content. Always respond with valid JSON format.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return this.parseBlogResponse(response);
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to generate blog post with Claude');
    }
  }

  private buildBlogPrompt(request: ClaudeRequest): string {
    // Use custom prompt if provided, otherwise use conversational template
    if (request.customPrompt && request.customPrompt.trim()) {
      // Custom prompt - prepare variables and render
      const variables = promptTemplateManager.prepareVariablesFromAnalysis(
        request.sourceAnalysis,
        request.topic,
        request.wordCount,
        request.tone,
        request.targetAudience
      );

      // If custom prompt contains variables, render them
      if (request.customPrompt.includes('{')) {
        try {
          // Create a temporary custom template
          const customTemplate = {
            id: 'temp-custom',
            name: 'Custom',
            description: 'User custom prompt',
            template: request.customPrompt,
            variables: [],
            category: 'custom' as const
          };

          // Add the template temporarily
          const tempId = promptTemplateManager.addCustomTemplate(customTemplate);
          const renderedPrompt = promptTemplateManager.renderTemplate(tempId, variables);
          
          return this.addJsonInstructions(renderedPrompt, request.wordCount);
        } catch (error) {
          console.warn('Failed to render custom prompt, falling back to default:', error);
        }
      }

      // Custom prompt without variables
      return this.addJsonInstructions(request.customPrompt, request.wordCount);
    }

    // Default conversational template
    const variables = promptTemplateManager.prepareVariablesFromAnalysis(
      request.sourceAnalysis,
      request.topic,
      request.wordCount,
      request.tone,
      request.targetAudience
    );

    const renderedPrompt = promptTemplateManager.renderTemplate('conversational', variables);
    return this.addJsonInstructions(renderedPrompt, request.wordCount);
  }

  private addJsonInstructions(prompt: string, wordCount: number): string {
    return `${prompt}

IMPORTANT: Respond with ONLY valid JSON in this exact format:

{
  "title": "Engaging blog post title (50-60 characters)",
  "content": "Full blog post content in HTML format with proper headings, paragraphs, and formatting",
  "metaDescription": "SEO-optimized meta description (150-160 characters)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seoScore": 85,
  "excerpt": "Brief excerpt for blog preview (150-200 characters)"
}

The content should be approximately ${wordCount} words and feel genuinely human-written.`;
  }

  private parseBlogResponse(response: Anthropic.Messages.Message): BlogGeneration {
    try {
      let content = '';
      
      // Handle the response structure
      if (response.content && Array.isArray(response.content)) {
        content = response.content
          .filter((block) => block.type === 'text')
          .map((block) => block.type === 'text' ? block.text : '')
          .join('');
      } else if (typeof response.content === 'string') {
        content = response.content;
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as BlogGeneration;
      
      // Validate required fields
      if (!parsed.title || !parsed.content || !parsed.metaDescription) {
        throw new Error('Missing required fields in Claude response');
      }

      // Ensure arrays exist
      parsed.tags = parsed.tags || [];
      parsed.seoScore = parsed.seoScore || 75;
      parsed.excerpt = parsed.excerpt || parsed.content.substring(0, 200).replace(/<[^>]*>/g, '') + '...';

      return parsed;
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      
      // Return fallback blog post
      return {
        title: 'Blog Post Generation Failed',
        content: '<p>There was an error generating the blog post. Please try again with different inputs.</p>',
        metaDescription: 'Blog post generation encountered an error. Please retry.',
        tags: ['error', 'retry'],
        seoScore: 0,
        excerpt: 'Blog post generation failed. Please try again.'
      };
    }
  }

  async generateMetaOnly(content: string, title: string): Promise<{ metaDescription: string; tags: string[] }> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: `Generate SEO metadata for this blog post:

TITLE: ${title}
CONTENT: ${content.substring(0, 1000)}...

Respond with JSON only:
{
  "metaDescription": "150-160 character SEO description",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`
          }
        ]
      });

      let responseContent = '';
      if (response.content && Array.isArray(response.content)) {
        responseContent = response.content
          .filter((block) => block.type === 'text')
          .map((block) => block.type === 'text' ? block.text : '')
          .join('');
      }

      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('No valid JSON in response');
    } catch (error) {
      console.error('Failed to generate metadata:', error);
      return {
        metaDescription: 'Generated blog post content.',
        tags: ['blog', 'content']
      };
    }
  }
}

export const claudeService = new ClaudeService();