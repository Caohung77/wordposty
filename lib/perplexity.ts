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

  // SEO-specific analysis method
  async analyzeSEOKeyword(keyword: string): Promise<any> {
    try {
      const prompt = this.buildSEOAnalysisPrompt(keyword);
      
      const response = await axios.post<PerplexityResponse>(
        this.baseUrl,
        {
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a professional SEO analyst. Analyze Google search results and provide structured data in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          search_mode: 'web',
          reasoning_effort: 'high',
          temperature: 0.2,
          max_tokens: 3000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseSEOAnalysisResponse(response.data);
    } catch (error) {
      console.error('Perplexity SEO analysis error:', error);
      throw new Error('Failed to analyze keyword with Perplexity');
    }
  }

  private buildSEOAnalysisPrompt(keyword: string): string {
    return `Analyze Google search results for: "${keyword}"

Search for the exact keyword "${keyword}" and analyze the top 15 ranking pages. Focus on HEADING TERM FREQUENCY ANALYSIS:

TASK:
1. Extract ALL H1, H2, H3 headings from each top-ranking page
2. Identify key terms and phrases (2-4 words) within these headings
3. Count frequency of each term/phrase across ALL headings from ALL pages
4. Group similar variations and calculate relevance scores
5. Analyze heading patterns and structures

Return analysis in this EXACT JSON format:

{
  "headingTermsFrequency": [
    {
      "term": "klarna bonität",
      "frequency": 3,
      "headingLevels": ["h1", "h2"],
      "examples": ["Klarna Bonität prüfen", "Was ist Klarna Bonität"],
      "relevanceScore": 0.95,
      "variations": ["bonität klarna", "klarna bonitätsprüfung"]
    }
  ],
  "topSingleWords": [
    {
      "word": "klarna",
      "frequency": 15,
      "headingLevels": ["h1", "h2", "h3"]
    }
  ],
  "headingPatterns": {
    "commonStructures": ["How to + [action]", "[Brand] + [feature]"],
    "avgHeadingsPerPage": 8.5,
    "h1Patterns": ["[Brand] [Service] erklärt"],
    "h2Patterns": ["Wie funktioniert [Feature]"],
    "h3Patterns": ["Vorteile von [Service]"],
    "totalHeadingsAnalyzed": 127
  },
  "strategicInsights": {
    "topOpportunities": ["Focus on 'klarna bonität' in H1/H2"],
    "competitorGaps": ["Limited coverage of improvement strategies"],
    "recommendedStructure": ["H1: Main keyword phrase", "H2: How-to sections"]
  },
  "analyzedUrls": ["https://example1.com", "https://example2.com"],
  "totalResults": 15,
  "totalHeadingsFound": 127
}

CRITICAL REQUIREMENTS:
- Search for "${keyword}" specifically in Google
- Extract EXACT phrases from headings (2-4 words, not single words)
- Count frequency across ALL pages analyzed
- Include actual heading examples for each term
- Group semantically similar terms (e.g., "klarna bonität" + "bonität klarna")
- Calculate relevance based on frequency + heading level importance (H1 > H2 > H3)
- Show which heading levels contain each term
- Identify common heading patterns and structures

Respond ONLY with valid JSON - no explanations.`;
  }

  private parseSEOAnalysisResponse(response: PerplexityResponse): any {
    try {
      const content = response.choices[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in SEO analysis response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (!parsed.headingTermsFrequency || !parsed.topSingleWords) {
        throw new Error('Invalid SEO analysis response structure');
      }

      // Ensure proper structure for headingTermsFrequency
      parsed.headingTermsFrequency = parsed.headingTermsFrequency.map((term: any) => ({
        term: term.term || '',
        frequency: term.frequency || 0,
        headingLevels: term.headingLevels || [],
        examples: term.examples || [],
        relevanceScore: term.relevanceScore || 0,
        variations: term.variations || []
      }));

      // Ensure proper structure for topSingleWords
      parsed.topSingleWords = parsed.topSingleWords.map((word: any) => ({
        word: word.word || '',
        frequency: word.frequency || 0,
        headingLevels: word.headingLevels || []
      }));

      // Ensure headingPatterns structure
      if (!parsed.headingPatterns) {
        parsed.headingPatterns = {
          commonStructures: [],
          avgHeadingsPerPage: 0,
          h1Patterns: [],
          h2Patterns: [],
          h3Patterns: [],
          totalHeadingsAnalyzed: 0
        };
      }

      // Ensure strategicInsights structure
      if (!parsed.strategicInsights) {
        parsed.strategicInsights = {
          topOpportunities: [],
          competitorGaps: [],
          recommendedStructure: []
        };
      }

      // Sort by frequency and relevance
      parsed.headingTermsFrequency.sort((a: any, b: any) => b.frequency - a.frequency || b.relevanceScore - a.relevanceScore);
      parsed.topSingleWords.sort((a: any, b: any) => b.frequency - a.frequency);

      return parsed;
    } catch (error) {
      console.error('Failed to parse SEO analysis response:', error);
      
      // Return fallback
      return {
        headingTermsFrequency: [
          {
            term: 'analysis failed',
            frequency: 1,
            headingLevels: ['error'],
            examples: ['Please retry the analysis'],
            relevanceScore: 0.1,
            variations: ['retry analysis']
          }
        ],
        topSingleWords: [
          {
            word: 'error',
            frequency: 1,
            headingLevels: ['error']
          }
        ],
        headingPatterns: {
          commonStructures: ['Error occurred'],
          avgHeadingsPerPage: 0,
          h1Patterns: ['Analysis failed'],
          h2Patterns: ['Please retry'],
          h3Patterns: ['Check connection'],
          totalHeadingsAnalyzed: 0
        },
        strategicInsights: {
          topOpportunities: ['Retry analysis'],
          competitorGaps: ['Analysis incomplete'],
          recommendedStructure: ['Please try again']
        },
        analyzedUrls: ['Analysis failed'],
        totalResults: 0,
        totalHeadingsFound: 0
      };
    }
  }
}

export const perplexityService = new PerplexityService();