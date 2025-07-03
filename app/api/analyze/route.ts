import { NextRequest, NextResponse } from 'next/server';
import { sourceManager, SourceInput } from '@/lib/source-manager';
import { perplexityService } from '@/lib/perplexity';
import { withRateLimit } from '@/lib/rate-limiter';
import { handleAPIError, logError, createErrorResponse } from '@/lib/error-handler';

export interface AnalyzeRequest {
  sources: SourceInput[];
  topic: string;
  targetAudience?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as AnalyzeRequest;
    
    // Validate request
    if (!body.sources || !Array.isArray(body.sources) || body.sources.length === 0) {
      return NextResponse.json(
        createErrorResponse(new Error('Sources array is required and cannot be empty')),
        { status: 400 }
      );
    }

    if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length === 0) {
      return NextResponse.json(
        createErrorResponse(new Error('Topic is required and cannot be empty')),
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Apply rate limiting and process with Perplexity
    const result = await withRateLimit('perplexity', clientIP, async () => {
      return await analyzeSourcesWithPerplexity(body);
    });

    return NextResponse.json({
      success: true,
      analysis: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const apiError = handleAPIError(error, 'analyze-api');
    logError(apiError, { endpoint: '/api/analyze' });
    
    return NextResponse.json(
      createErrorResponse(apiError),
      { status: apiError.statusCode }
    );
  }
}

async function analyzeSourcesWithPerplexity(request: AnalyzeRequest) {
  try {
    // Step 1: Process all sources
    console.log('Processing sources...');
    const sourceResult = await sourceManager.processSources(request.sources);
    
    if (!sourceResult.success) {
      throw new Error(`Source processing failed: ${sourceResult.errors.join('; ')}`);
    }

    // Step 2: Validate sources for analysis
    const validation = sourceManager.validateSourcesForAnalysis(sourceResult.sources);
    if (!validation.valid) {
      throw new Error(`Source validation failed: ${validation.errors.join('; ')}`);
    }

    // Step 3: Prepare for Perplexity analysis
    const sourcesFormatted = sourceManager.formatSourcesForPrompt(sourceResult.sources);
    
    console.log('Analyzing with Perplexity AI...');
    const analysis = await perplexityService.analyzeSources({
      sources: [sourcesFormatted],
      topic: request.topic,
      targetAudience: request.targetAudience
    });

    // Step 4: Return comprehensive result
    return {
      sourceProcessing: {
        success: sourceResult.success,
        processedSources: sourceResult.sources.length,
        totalWordCount: sourceResult.totalWordCount,
        summary: sourceManager.getSourcesSummary(sourceResult.sources),
        errors: sourceResult.errors
      },
      perplexityAnalysis: analysis,
      metadata: {
        topic: request.topic,
        targetAudience: request.targetAudience,
        processedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze sources.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze sources.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze sources.' },
    { status: 405 }
  );
}