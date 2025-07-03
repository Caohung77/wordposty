import { perplexityService } from './perplexity';

export interface SEOAnalysisRequest {
  keyword: string;
  options?: {
    maxResults?: number;
    includeContent?: boolean;
    languageCode?: string;
  };
}

export interface HeadingTermFrequency {
  term: string;
  frequency: number;
  headingLevels: string[];
  examples: string[];
  relevanceScore: number;
  variations: string[];
}

export interface HeadingPatterns {
  commonStructures: string[];
  avgHeadingsPerPage: number;
  h1Patterns: string[];
  h2Patterns: string[];
  h3Patterns: string[];
  totalHeadingsAnalyzed: number;
}

export interface ContentTermFrequency {
  term: string;
  frequency: number;
  relevanceScore: number;
  context: string;
  variations: string[];
}

export interface SEOAnalysisResult {
  keyword: string;
  headingTermsFrequency: HeadingTermFrequency[];
  contentTermsFrequency: ContentTermFrequency[];
  topSingleWords: {
    word: string;
    frequency: number;
    headingLevels: string[];
  }[];
  headingPatterns: HeadingPatterns;
  strategicInsights: {
    topOpportunities: string[];
    competitorGaps: string[];
    recommendedStructure: string[];
  };
  metadata: {
    analyzedUrls: string[];
    analysisDate: string;
    totalResults: number;
    totalHeadingsFound: number;
    totalContentWordsAnalyzed: number;
    totalContentTermsFound: number;
  };
}

export interface SEOPerplexityResponse {
  headingTermsFrequency: HeadingTermFrequency[];
  contentTermsFrequency: ContentTermFrequency[];
  topSingleWords: {
    word: string;
    frequency: number;
    headingLevels: string[];
  }[];
  headingPatterns: HeadingPatterns;
  strategicInsights: {
    topOpportunities: string[];
    competitorGaps: string[];
    recommendedStructure: string[];
  };
  analyzedUrls: string[];
  totalResults: number;
  totalHeadingsFound: number;
  totalContentWordsAnalyzed: number;
  totalContentTermsFound: number;
}

class SEOAnalyzer {
  async analyzeKeyword(request: SEOAnalysisRequest): Promise<SEOAnalysisResult> {
    try {
      console.log('Starting SEO analysis for keyword:', request.keyword);
      
      const prompt = this.buildSEOAnalysisPrompt(request);
      
      // Use Perplexity to analyze the keyword
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a professional SEO analyst. Analyze the top Google search results and provide structured data in JSON format.'
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
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisData = this.parsePerplexityResponse(data);

      return {
        keyword: request.keyword,
        headingTermsFrequency: analysisData.headingTermsFrequency,
        contentTermsFrequency: analysisData.contentTermsFrequency,
        topSingleWords: analysisData.topSingleWords,
        headingPatterns: analysisData.headingPatterns,
        strategicInsights: analysisData.strategicInsights,
        metadata: {
          analyzedUrls: analysisData.analyzedUrls,
          analysisDate: new Date().toISOString(),
          totalResults: analysisData.totalResults,
          totalHeadingsFound: analysisData.totalHeadingsFound,
          totalContentWordsAnalyzed: analysisData.totalContentWordsAnalyzed,
          totalContentTermsFound: analysisData.totalContentTermsFound || 0
        }
      };

    } catch (error) {
      console.error('SEO analysis error:', error);
      throw new Error(`SEO analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSEOAnalysisPrompt(request: SEOAnalysisRequest): string {
    return `Analyze Google search results for: "${request.keyword}"

Search for the exact keyword "${request.keyword}" and analyze the top 15 ranking pages. Focus on HEADING + CONTENT TERM FREQUENCY ANALYSIS:

TASK:
1. Extract ALL H1, H2, H3 headings from each top-ranking page
2. Extract ALL body content text from each top-ranking page
3. Identify key terms and phrases (2-4 words) within headings
4. Identify key terms and phrases (2-4 words) within body content
5. Count frequency of each term/phrase across ALL pages
6. Group similar variations and calculate relevance scores
7. Analyze heading patterns and content structures

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
    },
    {
      "term": "klarna score",
      "frequency": 5,
      "headingLevels": ["h2", "h3"],
      "examples": ["Wie funktioniert der Klarna Score", "Klarna Score verbessern"],
      "relevanceScore": 0.88,
      "variations": ["score klarna"]
    }
  ],
  "contentTermsFrequency": [
    {
      "term": "zur verfügung",
      "frequency": 4,
      "relevanceScore": 0.82,
      "context": "steht zur verfügung",
      "variations": ["verfügung stehen", "verfügbar"]
    },
    {
      "term": "deine kreditwürdigkeit auswirken",
      "frequency": 2,
      "relevanceScore": 0.78,
      "context": "kann sich auf deine kreditwürdigkeit auswirken",
      "variations": ["kreditwürdigkeit beeinflussen"]
    },
    {
      "term": "deinen schufa-score",
      "frequency": 2,
      "relevanceScore": 0.75,
      "context": "beeinflusst deinen schufa-score",
      "variations": ["schufa score", "schufa-bewertung"]
    }
  ],
  "topSingleWords": [
    {
      "word": "klarna",
      "frequency": 15,
      "headingLevels": ["h1", "h2", "h3"]
    },
    {
      "word": "bonität",
      "frequency": 12,
      "headingLevels": ["h1", "h2", "h3"]
    }
  ],
  "headingPatterns": {
    "commonStructures": ["How to + [action]", "[Brand] + [feature]", "Was ist + [concept]"],
    "avgHeadingsPerPage": 8.5,
    "h1Patterns": ["[Brand] [Service] erklärt", "Alles über [Topic]"],
    "h2Patterns": ["Wie funktioniert [Feature]", "[Action] in 3 Schritten"],
    "h3Patterns": ["Vorteile von [Service]", "Häufige Fragen zu [Topic]"],
    "totalHeadingsAnalyzed": 127
  },
  "strategicInsights": {
    "topOpportunities": ["Focus on 'klarna bonität' in H1/H2", "Use 'score' terminology"],
    "competitorGaps": ["Limited coverage of improvement strategies"],
    "recommendedStructure": ["H1: Main keyword phrase", "H2: How-to sections", "H3: Specific benefits"]
  },
  "analyzedUrls": ["https://example1.com", "https://example2.com"],
  "totalResults": 15,
  "totalHeadingsFound": 127,
  "totalContentWordsAnalyzed": 8500,
  "totalContentTermsFound": 45
}

CRITICAL REQUIREMENTS:
- Search for "${request.keyword}" specifically in Google
- Extract EXACT phrases from headings (2-4 words, not single words)
- Count frequency across ALL pages analyzed
- Include actual heading examples for each term
- Group semantically similar terms (e.g., "klarna bonität" + "bonität klarna")
- Calculate relevance based on frequency + heading level importance (H1 > H2 > H3)
- Show which heading levels contain each term
- Identify common heading patterns and structures

Respond ONLY with valid JSON - no explanations.`;
  }

  private parsePerplexityResponse(response: any): SEOPerplexityResponse {
    try {
      const content = response.choices[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Perplexity response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as SEOPerplexityResponse;
      
      // Validate required fields
      if (!parsed.headingTermsFrequency || !parsed.topSingleWords || !parsed.analyzedUrls) {
        throw new Error('Invalid SEO analysis response structure');
      }

      // Ensure proper structure for headingTermsFrequency
      parsed.headingTermsFrequency = parsed.headingTermsFrequency.map(term => ({
        term: term.term || '',
        frequency: term.frequency || 0,
        headingLevels: term.headingLevels || [],
        examples: term.examples || [],
        relevanceScore: term.relevanceScore || 0,
        variations: term.variations || []
      }));

      // Ensure proper structure for contentTermsFrequency
      parsed.contentTermsFrequency = (parsed.contentTermsFrequency || []).map(term => ({
        term: term.term || '',
        frequency: term.frequency || 0,
        relevanceScore: term.relevanceScore || 0,
        context: term.context || '',
        variations: term.variations || []
      }));

      // Ensure proper structure for topSingleWords
      parsed.topSingleWords = parsed.topSingleWords.map(word => ({
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
      parsed.headingTermsFrequency.sort((a, b) => b.frequency - a.frequency || b.relevanceScore - a.relevanceScore);
      parsed.topSingleWords.sort((a, b) => b.frequency - a.frequency);

      return parsed;

    } catch (error) {
      console.error('Failed to parse Perplexity SEO response:', error);
      
      // Return fallback data
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
        contentTermsFrequency: [
          {
            term: 'retry analysis',
            frequency: 1,
            relevanceScore: 0.1,
            context: 'Please retry the analysis',
            variations: ['analysis failed']
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
        analyzedUrls: ['Error: No URLs analyzed'],
        totalResults: 0,
        totalHeadingsFound: 0,
        totalContentWordsAnalyzed: 0,
        totalContentTermsFound: 0
      };
    }
  }

  // Helper method to generate content outline based on analysis
  generateContentOutline(analysis: SEOAnalysisResult): string[] {
    const outline: string[] = [];
    
    // Use top heading terms as main sections
    analysis.headingTermsFrequency.slice(0, 8).forEach(term => {
      if (term.relevanceScore > 0.6) {
        outline.push(term.term);
      }
    });

    // Add recommended structure from strategic insights
    if (analysis.strategicInsights.recommendedStructure.length > 0) {
      outline.push(...analysis.strategicInsights.recommendedStructure.slice(0, 3));
    }

    return outline.slice(0, 10); // Limit to 10 sections
  }

  // Helper method to extract SEO keywords from frequency analysis
  extractSEOKeywords(analysis: SEOAnalysisResult): string[] {
    const keywords: string[] = [];
    
    // Primary keywords from heading terms
    analysis.headingTermsFrequency
      .filter(term => term.relevanceScore > 0.5)
      .slice(0, 10)
      .forEach(term => {
        keywords.push(term.term);
        // Add variations
        keywords.push(...term.variations.slice(0, 2));
      });

    // Secondary keywords from single words
    analysis.topSingleWords
      .slice(0, 10)
      .forEach(word => {
        keywords.push(word.word);
      });

    // Remove duplicates and return
    return [...new Set(keywords)].slice(0, 20);
  }

  // Helper method to get heading level insights
  getHeadingLevelInsights(analysis: SEOAnalysisResult): {
    h1Focus: string[];
    h2Focus: string[];
    h3Focus: string[];
  } {
    const h1Terms = analysis.headingTermsFrequency
      .filter(term => term.headingLevels.includes('h1'))
      .map(term => term.term);
    
    const h2Terms = analysis.headingTermsFrequency
      .filter(term => term.headingLevels.includes('h2'))
      .map(term => term.term);
    
    const h3Terms = analysis.headingTermsFrequency
      .filter(term => term.headingLevels.includes('h3'))
      .map(term => term.term);

    return {
      h1Focus: h1Terms.slice(0, 5),
      h2Focus: h2Terms.slice(0, 8),
      h3Focus: h3Terms.slice(0, 10)
    };
  }
}

export const seoAnalyzer = new SEOAnalyzer();