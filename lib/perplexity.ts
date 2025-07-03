import axios from 'axios';

export interface SourceAnalysis {
  keyInsights: string[];
  mainThemes: string[];
  currentTrends: string[];
  seoKeywords: string[];
  factualClaims: string[];
  citations: string[];
}

export interface PerplexityRequest {
  sources: string[];
  topic: string;
  targetAudience?: string;
}

export interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class PerplexityService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is required');
    }
  }

  async analyzeSources(request: PerplexityRequest): Promise<SourceAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const response = await axios.post<PerplexityResponse>(
        this.baseUrl,
        {
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a professional content researcher and SEO analyst. Provide structured analysis in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          search_mode: 'web',
          reasoning_effort: 'high',
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseAnalysisResponse(response.data);
    } catch (error) {
      console.error('Perplexity API error:', error);
      throw new Error('Failed to analyze sources with Perplexity');
    }
  }

  private buildAnalysisPrompt(request: PerplexityRequest): string {
    const sourcesText = request.sources.join('\n\n---\n\n');
    
    return `Analyze the following sources for blog content creation:

SOURCES:
${sourcesText}

TOPIC: ${request.topic}
TARGET AUDIENCE: ${request.targetAudience || 'General audience'}

Using your web search capabilities and reasoning, provide analysis in this EXACT JSON format:

{
  "keyInsights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"],
  "mainThemes": ["theme 1", "theme 2", "theme 3"],
  "currentTrends": ["trend 1", "trend 2", "trend 3"],
  "seoKeywords": ["primary keyword", "secondary 1", "secondary 2", "long tail 1", "long tail 2"],
  "factualClaims": ["claim 1 with verification", "claim 2 with verification"],
  "citations": ["source 1 with URL", "source 2 with URL", "source 3 with URL"]
}

Requirements:
1. Extract 5-7 key insights with current data from ${new Date().getFullYear()}
2. Identify 3 main themes that emerge from the sources
3. Find 3 trending topics related to the subject using web search
4. Suggest 5 SEO keywords (1 primary, 2 secondary, 2 long-tail)
5. Verify 2 important factual claims from the sources
6. Provide 3 credible citations with URLs

Respond ONLY with valid JSON - no additional text or explanation.`;
  }

  private parseAnalysisResponse(response: PerplexityResponse): SourceAnalysis {
    try {
      const content = response.choices[0]?.message?.content || '';
      
      // Extract JSON from response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as SourceAnalysis;
      
      // Validate required fields
      if (!parsed.keyInsights || !Array.isArray(parsed.keyInsights)) {
        throw new Error('Invalid keyInsights in response');
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse Perplexity response:', error);
      
      // Return fallback analysis
      return {
        keyInsights: ['Analysis failed - manual review needed'],
        mainThemes: ['General content'],
        currentTrends: ['Current industry trends'],
        seoKeywords: ['content', 'blog', 'article'],
        factualClaims: ['Claims need verification'],
        citations: ['Manual citation needed']
      };
    }
  }
}

export const perplexityService = new PerplexityService();