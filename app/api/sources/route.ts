import { NextRequest, NextResponse } from 'next/server';
import { sourceManager, SourceInput } from '@/lib/source-manager';
import { handleAPIError, logError, createErrorResponse } from '@/lib/error-handler';

export interface ProcessSourcesRequest {
  sources: SourceInput[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as ProcessSourcesRequest;
    
    // Validate request
    if (!body.sources || !Array.isArray(body.sources) || body.sources.length === 0) {
      return NextResponse.json(
        createErrorResponse(new Error('Sources array is required and cannot be empty')),
        { status: 400 }
      );
    }

    console.log(`Processing ${body.sources.length} sources...`);
    
    // Process sources
    const result = await sourceManager.processSources(body.sources);
    
    // Get summary
    const summary = sourceManager.getSourcesSummary(result.sources);
    
    return NextResponse.json({
      success: result.success,
      sources: result.sources,
      summary,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const apiError = handleAPIError(error, 'sources-api');
    logError(apiError, { endpoint: '/api/sources' });
    
    return NextResponse.json(
      createErrorResponse(apiError),
      { status: apiError.statusCode }
    );
  }
}

// GET endpoint to return supported source types and limits
export async function GET() {
  return NextResponse.json({
    supportedTypes: ['text', 'url', 'file'],
    fileTypes: {
      supported: ['.pdf', '.txt', '.md'],
      maxSize: '10MB'
    },
    limits: {
      maxSources: 10,
      maxTotalWords: 20000,
      minTotalWords: 50
    },
    examples: {
      text: {
        id: 'text-1',
        type: 'text',
        content: 'Your text content here...'
      },
      url: {
        id: 'url-1',
        type: 'url',
        content: 'https://example.com/article'
      },
      file: {
        id: 'file-1',
        type: 'file',
        content: 'document.pdf',
        file: '[File object]'
      }
    }
  });
}