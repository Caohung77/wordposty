import { NextRequest, NextResponse } from 'next/server';
import { imagenService, ImageGenerationRequest } from '@/lib/imagen';
import { withRateLimit } from '@/lib/rate-limiter';
import { handleAPIError, logError, createErrorResponse } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as ImageGenerationRequest;
    
    // Validate request
    if (!body.blogGeneration) {
      return NextResponse.json(
        createErrorResponse(new Error('Blog generation data is required for image generation')),
        { status: 400 }
      );
    }

    if (!body.blogGeneration.title) {
      return NextResponse.json(
        createErrorResponse(new Error('Blog title is required for image generation')),
        { status: 400 }
      );
    }

    // Validate custom prompt if provided
    if (body.customPrompt && body.customPrompt.trim().length === 0) {
      return NextResponse.json(
        createErrorResponse(new Error('Custom prompt cannot be empty')),
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Apply rate limiting and generate image
    const result = await withRateLimit('imagen', clientIP, async () => {
      return await generateImageWithImagen(body);
    });

    return NextResponse.json({
      success: true,
      image: result,
      metadata: {
        title: body.blogGeneration.title,
        useSmartPrompt: body.useSmartPrompt,
        hasCustomPrompt: !!body.customPrompt,
        generatedAt: new Date().toISOString(),
        model: 'imagen-3.0'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const apiError = handleAPIError(error, 'imagen-generate-api');
    logError(apiError, { endpoint: '/api/imagen/generate' });
    
    return NextResponse.json(
      createErrorResponse(apiError),
      { status: apiError.statusCode }
    );
  }
}

async function generateImageWithImagen(request: ImageGenerationRequest) {
  try {
    console.log('Generating image with Google Imagen...', {
      title: request.blogGeneration.title,
      useSmartPrompt: request.useSmartPrompt,
      hasCustomPrompt: !!request.customPrompt,
      hasAnalysis: !!request.sourceAnalysis
    });

    // Generate image
    const imageGeneration = await imagenService.generateImage(request);

    console.log('Image generation completed successfully:', {
      promptLength: imageGeneration.prompt.length,
      imageGenerated: !!imageGeneration.imageUrl,
      timestamp: imageGeneration.timestamp
    });

    return imageGeneration;

  } catch (error) {
    console.error('Imagen generation error:', error);
    throw error;
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({
    message: 'Image Generation API',
    description: 'Use POST to generate featured images with Google Imagen',
    requiredFields: ['blogGeneration'],
    optionalFields: ['sourceAnalysis', 'customPrompt', 'useSmartPrompt'],
    example: {
      blogGeneration: {
        title: 'How to Build AI Applications',
        content: 'Blog content...',
        metaDescription: 'Learn to build AI apps',
        tags: ['ai', 'development'],
        seoScore: 85,
        excerpt: 'Brief excerpt...'
      },
      sourceAnalysis: {
        keyInsights: ['insight1', 'insight2'],
        seoKeywords: ['ai', 'development'],
        currentTrends: ['trend1'],
        mainThemes: ['technology', 'automation']
      },
      useSmartPrompt: true
    }
  });
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate images.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate images.' },
    { status: 405 }
  );
}