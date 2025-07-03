import { NextRequest, NextResponse } from 'next/server';
import { seoAnalyzer, SEOAnalysisRequest } from '@/lib/seo-analyzer';
import { withRateLimit } from '@/lib/rate-limiter';
import { handleAPIError, logError, createErrorResponse } from '@/lib/error-handler';

export interface SEOAnalyzeRequestBody {
  keyword: string;
  options?: {
    maxResults?: number;
    includeContent?: boolean;
    languageCode?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as SEOAnalyzeRequestBody;
    
    // Validate request
    if (!body.keyword || typeof body.keyword !== 'string' || body.keyword.trim().length === 0) {
      return NextResponse.json(
        createErrorResponse(new Error('Keyword is required and cannot be empty')),
        { status: 400 }
      );
    }

    // Check keyword length
    if (body.keyword.trim().length > 100) {
      return NextResponse.json(
        createErrorResponse(new Error('Keyword must be 100 characters or less')),
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Apply rate limiting and process with SEO analyzer
    const result = await withRateLimit('seo-analysis', clientIP, async () => {
      return await analyzeSEOKeyword({
        keyword: body.keyword.trim(),
        options: body.options || {}
      });
    });

    return NextResponse.json({
      success: true,
      analysis: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const apiError = handleAPIError(error, 'seo-analyze-api');
    logError(apiError, { 
      endpoint: '/api/seo-analyze',
      keyword: 'keyword' in (error as any) ? (error as any).keyword : 'unknown'
    });
    
    return NextResponse.json(
      createErrorResponse(apiError),
      { status: apiError.statusCode }
    );
  }
}

async function analyzeSEOKeyword(request: SEOAnalysisRequest) {
  try {
    console.log('Starting SEO keyword analysis:', request.keyword);
    
    // Set default options
    const options = {
      maxResults: 10,
      includeContent: true,
      languageCode: 'en',
      ...request.options
    };

    // Perform SEO analysis
    const analysis = await seoAnalyzer.analyzeKeyword({
      keyword: request.keyword,
      options
    });

    console.log('SEO analysis completed:', {
      keyword: analysis.keyword,
      headingTermsCount: analysis.headingTermsFrequency.length,
      topSingleWordsCount: analysis.topSingleWords.length,
      analyzedUrlsCount: analysis.metadata.analyzedUrls.length,
      totalHeadingsFound: analysis.metadata.totalHeadingsFound
    });

    // Generate additional insights
    const insights = {
      topHeadings: extractTopHeadings(analysis),
      contentSuggestions: generateContentSuggestions(analysis),
      competitorInsights: analyzeCompetitorPatterns(analysis)
    };

    return {
      ...analysis,
      insights
    };

  } catch (error) {
    console.error('SEO keyword analysis error:', error);
    throw error;
  }
}

// Helper function to extract top headings across all levels
function extractTopHeadings(analysis: any) {
  const topHeadings = analysis.headingTermsFrequency
    .slice(0, 10)
    .map((term: any) => ({
      text: term.term,
      frequency: term.frequency,
      levels: term.headingLevels,
      relevance: term.relevanceScore
    }));

  return topHeadings;
}

// Helper function to generate content suggestions
function generateContentSuggestions(analysis: any) {
  const topTerms = analysis.headingTermsFrequency
    .filter((term: any) => term.relevanceScore > 0.6)
    .slice(0, 8);

  return topTerms.map((term: any) => ({
    suggestion: `Create content about ${term.term}`,
    relevance: term.relevanceScore,
    frequency: term.frequency,
    headingLevels: term.headingLevels
  }));
}

// Helper function to analyze competitor patterns
function analyzeCompetitorPatterns(analysis: any) {
  const patterns = {
    commonHeadingPatterns: analysis.headingPatterns?.commonStructures || [],
    contentFocus: analysis.topSingleWords?.slice(0, 5).map((word: any) => word.word) || [],
    structureInsights: analysis.strategicInsights?.topOpportunities || []
  };

  // Add additional insights based on heading patterns
  if (analysis.headingPatterns?.avgHeadingsPerPage) {
    patterns.structureInsights.push(`Average ${analysis.headingPatterns.avgHeadingsPerPage} headings per page`);
  }

  if (analysis.headingPatterns?.totalHeadingsAnalyzed) {
    patterns.structureInsights.push(`Analyzed ${analysis.headingPatterns.totalHeadingsAnalyzed} total headings`);
  }

  return patterns;
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { 
      endpoint: '/api/seo-analyze',
      description: 'Analyze keywords for SEO insights',
      methods: ['POST'],
      requiredFields: ['keyword'],
      optionalFields: ['options'],
      example: {
        keyword: 'AI content creation',
        options: {
          maxResults: 10,
          includeContent: true,
          languageCode: 'en'
        }
      },
      rateLimit: 'Limited to prevent abuse'
    },
    { status: 200 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze SEO keywords.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze SEO keywords.' },
    { status: 405 }
  );
}