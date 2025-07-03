import { NextRequest, NextResponse } from 'next/server';
import { wordpressService, PublishOptions } from '@/lib/wordpress';
import { BlogGeneration } from '@/lib/claude';
import { withRateLimit } from '@/lib/rate-limiter';
import { handleAPIError, logError, createErrorResponse } from '@/lib/error-handler';

export interface WordPressPublishRequest {
  blogGeneration: BlogGeneration;
  publishOptions: PublishOptions;
  siteCredentials?: {
    url: string;
    username: string;
    password: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as WordPressPublishRequest;
    
    // Validate request
    if (!body.blogGeneration) {
      return NextResponse.json(
        createErrorResponse(new Error('Blog generation data is required')),
        { status: 400 }
      );
    }

    if (!body.blogGeneration.title || !body.blogGeneration.content) {
      return NextResponse.json(
        createErrorResponse(new Error('Blog post must have title and content')),
        { status: 400 }
      );
    }

    // Set default publish options
    const publishOptions: PublishOptions = {
      status: 'draft',
      allowComments: true,
      categories: [],
      tags: [],
      ...body.publishOptions
    };

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Apply rate limiting and publish
    const result = await withRateLimit('wordpress', clientIP, async () => {
      return await publishToWordPress(body.blogGeneration, publishOptions, body.siteCredentials);
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        post: {
          id: result.post?.id,
          title: result.post?.title?.rendered,
          status: result.post?.status,
          link: result.post?.link
        },
        url: result.url,
        warnings: result.warnings,
        publishedAt: new Date().toISOString(),
        metadata: {
          status: publishOptions.status,
          categories: publishOptions.categories,
          tags: publishOptions.tags,
          seoScore: body.blogGeneration.seoScore
        }
      });
    } else {
      return NextResponse.json(
        createErrorResponse(new Error(result.error || 'Publishing failed')),
        { status: 500 }
      );
    }

  } catch (error) {
    const apiError = handleAPIError(error, 'wordpress-publish');
    logError(apiError, { endpoint: '/api/wordpress/publish' });
    
    return NextResponse.json(
      createErrorResponse(apiError),
      { status: apiError.statusCode }
    );
  }
}

async function publishToWordPress(
  blogGeneration: BlogGeneration,
  publishOptions: PublishOptions,
  siteCredentials?: WordPressPublishRequest['siteCredentials']
): Promise<any> {
  try {
    console.log('Publishing to WordPress...', {
      title: blogGeneration.title,
      status: publishOptions.status,
      hasCredentials: !!siteCredentials
    });

    // Use provided credentials or default service
    let wpService = wordpressService;
    if (siteCredentials) {
      const { createWordPressService } = await import('@/lib/wordpress');
      wpService = createWordPressService(siteCredentials);
    }

    // Test connection first
    const connectionTest = await wpService.testConnection();
    if (!connectionTest.success) {
      throw new Error(`WordPress connection failed: ${connectionTest.error}`);
    }

    console.log('WordPress connection successful:', connectionTest.siteInfo);

    // Prepare tags from blog generation
    const tags = [
      ...(publishOptions.tags || []),
      ...(blogGeneration.tags || [])
    ].filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates

    // Enhanced publish options with blog data
    const enhancedOptions: PublishOptions = {
      ...publishOptions,
      tags,
      seoTitle: blogGeneration.title,
      seoDescription: blogGeneration.metaDescription
    };

    // Publish the post
    const publishResult = await wpService.publishPost(blogGeneration, enhancedOptions);

    if (publishResult.success) {
      console.log('WordPress publishing successful:', {
        postId: publishResult.post?.id,
        url: publishResult.url,
        status: publishResult.post?.status
      });
    }

    return publishResult;

  } catch (error) {
    console.error('WordPress publishing error:', error);
    throw error;
  }
}

// Test connection endpoint
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const testConnection = url.searchParams.get('test') === 'true';

    if (testConnection) {
      const connectionResult = await wordpressService.testConnection();
      return NextResponse.json(connectionResult);
    }

    // Return WordPress publish info
    return NextResponse.json({
      endpoint: '/api/wordpress/publish',
      description: 'Publish generated blog posts to WordPress',
      methods: ['POST'],
      requiredFields: ['blogGeneration'],
      optionalFields: ['publishOptions', 'siteCredentials'],
      publishOptions: {
        status: ['draft', 'publish', 'pending', 'private', 'future'],
        categories: 'array of category names',
        tags: 'array of tag names',
        featuredImageUrl: 'URL of featured image',
        allowComments: 'boolean',
        scheduledDate: 'ISO date string (for future status)',
        seoTitle: 'custom SEO title',
        seoDescription: 'custom SEO description'
      },
      example: {
        blogGeneration: {
          title: 'Blog Post Title',
          content: '<p>Blog content...</p>',
          metaDescription: 'SEO description',
          tags: ['tag1', 'tag2'],
          seoScore: 85,
          excerpt: 'Post excerpt'
        },
        publishOptions: {
          status: 'draft',
          categories: ['Technology', 'AI'],
          tags: ['wordpress', 'api'],
          allowComments: true
        }
      }
    });
  } catch (error) {
    const apiError = handleAPIError(error, 'wordpress-info');
    return NextResponse.json(
      createErrorResponse(apiError),
      { status: apiError.statusCode }
    );
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to publish posts.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to publish posts.' },
    { status: 405 }
  );
}