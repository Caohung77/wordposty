import { NextRequest, NextResponse } from 'next/server';
import { claudeService, ClaudeRequest } from '@/lib/claude';
import { withRateLimit } from '@/lib/rate-limiter';
import { handleAPIError, logError, createErrorResponse } from '@/lib/error-handler';

export interface GenerateRequest extends ClaudeRequest {
  // Additional fields can be added here if needed
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as GenerateRequest;
    
    // Validate request
    if (!body.sourceAnalysis) {
      return NextResponse.json(
        createErrorResponse(new Error('Source analysis is required for blog generation')),
        { status: 400 }
      );
    }

    if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length === 0) {
      return NextResponse.json(
        createErrorResponse(new Error('Topic is required and cannot be empty')),
        { status: 400 }
      );
    }

    // Set defaults for optional fields
    const generateRequest: ClaudeRequest = {
      sourceAnalysis: body.sourceAnalysis,
      topic: body.topic.trim(),
      wordCount: body.wordCount || 800,
      tone: body.tone || 'conversational',
      targetAudience: body.targetAudience || 'general audience',
      customPrompt: body.customPrompt
    };

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Apply rate limiting and generate with Claude
    const result = await withRateLimit('claude', clientIP, async () => {
      return await generateBlogWithClaude(generateRequest);
    });

    return NextResponse.json({
      success: true,
      blog: result,
      metadata: {
        topic: generateRequest.topic,
        wordCount: generateRequest.wordCount,
        tone: generateRequest.tone,
        targetAudience: generateRequest.targetAudience,
        generatedAt: new Date().toISOString(),
        model: 'claude-sonnet-4-20250514'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const apiError = handleAPIError(error, 'generate-api');
    logError(apiError, { endpoint: '/api/generate' });
    
    return NextResponse.json(
      createErrorResponse(apiError),
      { status: apiError.statusCode }
    );
  }
}

async function generateBlogWithClaude(request: ClaudeRequest) {
  try {
    console.log('Generating blog post with Claude...', {
      topic: request.topic,
      wordCount: request.wordCount,
      tone: request.tone,
      hasSourceAnalysis: !!request.sourceAnalysis,
      hasCustomPrompt: !!request.customPrompt
    });

    // Generate blog post
    const blogGeneration = await claudeService.generateBlogPost(request);

    // Validate the generation result
    if (!blogGeneration.title || !blogGeneration.content) {
      throw new Error('Claude generation incomplete - missing title or content');
    }

    // Ensure minimum content requirements
    const wordCount = blogGeneration.content.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 200) {
      throw new Error('Generated content too short (minimum 200 words required)');
    }

    console.log('Blog generation completed successfully:', {
      title: blogGeneration.title,
      contentLength: blogGeneration.content.length,
      wordCount,
      seoScore: blogGeneration.seoScore,
      tagsCount: blogGeneration.tags?.length || 0
    });

    return blogGeneration;

  } catch (error) {
    console.error('Claude generation error:', error);
    throw error;
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({
    message: 'Blog Generation API',
    description: 'Use POST to generate blog posts with Claude AI',
    requiredFields: ['sourceAnalysis', 'topic'],
    optionalFields: ['wordCount', 'tone', 'targetAudience', 'customPrompt'],
    example: {
      sourceAnalysis: {
        keyInsights: ['insight1', 'insight2'],
        seoKeywords: ['keyword1', 'keyword2'],
        currentTrends: ['trend1', 'trend2'],
        mainThemes: ['theme1', 'theme2'],
        factualClaims: ['claim1', 'claim2'],
        citations: ['source1', 'source2']
      },
      topic: 'How to Build AI Applications',
      wordCount: 800,
      tone: 'conversational',
      targetAudience: 'developers'
    }
  });
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate blog posts.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate blog posts.' },
    { status: 405 }
  );
}