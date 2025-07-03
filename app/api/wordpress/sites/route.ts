import { NextRequest, NextResponse } from 'next/server';
import { createWordPressService, WordPressCredentials } from '@/lib/wordpress';
import { handleAPIError, logError, createErrorResponse } from '@/lib/error-handler';

export interface WordPressSiteInfo {
  url: string;
  name: string;
  description: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  connected: boolean;
  lastTested: string;
}

export interface TestSiteRequest {
  credentials: WordPressCredentials;
}

// Test WordPress site connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TestSiteRequest;
    
    // Validate credentials
    if (!body.credentials || !body.credentials.url || !body.credentials.username || !body.credentials.password) {
      return NextResponse.json(
        createErrorResponse(new Error('Complete WordPress credentials required (url, username, password)')),
        { status: 400 }
      );
    }

    console.log('Testing WordPress connection to:', body.credentials.url);

    // Create WordPress service with provided credentials
    const wpService = createWordPressService(body.credentials);
    
    // Test connection
    const testResult = await wpService.testConnection();
    
    if (testResult.success && testResult.siteInfo) {
      const siteInfo: WordPressSiteInfo = {
        url: body.credentials.url,
        name: testResult.siteInfo.name,
        description: testResult.siteInfo.description,
        timezone: testResult.siteInfo.timezone,
        language: testResult.siteInfo.language,
        dateFormat: testResult.siteInfo.dateFormat,
        timeFormat: testResult.siteInfo.timeFormat,
        connected: true,
        lastTested: new Date().toISOString()
      };

      // Also fetch some additional info
      try {
        const [categories, tags, recentPosts] = await Promise.all([
          wpService.getCategories(),
          wpService.getTags(),
          wpService.getPosts(5)
        ]);

        return NextResponse.json({
          success: true,
          siteInfo,
          additionalInfo: {
            categoriesCount: categories.length,
            tagsCount: tags.length,
            recentPostsCount: recentPosts.length,
            categories: categories.slice(0, 10).map(cat => ({ id: cat.id, name: cat.name })),
            tags: tags.slice(0, 20).map(tag => ({ id: tag.id, name: tag.name })),
            recentPosts: recentPosts.map(post => ({
              id: post.id,
              title: post.title.rendered,
              status: post.status,
              date: post.date
            }))
          }
        });
      } catch (error) {
        // Basic connection worked, but additional info failed
        return NextResponse.json({
          success: true,
          siteInfo,
          warning: 'Connected successfully but failed to fetch additional site information'
        });
      }
    } else {
      return NextResponse.json(
        createErrorResponse(new Error(testResult.error || 'Connection test failed')),
        { status: 400 }
      );
    }

  } catch (error) {
    const apiError = handleAPIError(error, 'wordpress-sites');
    logError(apiError, { endpoint: '/api/wordpress/sites' });
    
    return NextResponse.json(
      createErrorResponse(apiError),
      { status: apiError.statusCode }
    );
  }
}

// Get default site info (from environment variables)
export async function GET() {
  try {
    // Check if default credentials are available
    const hasDefaultCredentials = !!(
      process.env.WORDPRESS_API_URL && 
      process.env.WORDPRESS_USERNAME && 
      process.env.WORDPRESS_APP_PASSWORD
    );

    if (!hasDefaultCredentials) {
      return NextResponse.json({
        hasDefaultSite: false,
        message: 'No default WordPress site configured',
        requiredEnvVars: [
          'WORDPRESS_API_URL',
          'WORDPRESS_USERNAME', 
          'WORDPRESS_APP_PASSWORD'
        ]
      });
    }

    // Test default site
    try {
      const { wordpressService } = await import('@/lib/wordpress');
      const testResult = await wordpressService.testConnection();

      if (testResult.success && testResult.siteInfo) {
        const siteInfo: WordPressSiteInfo = {
          url: process.env.WORDPRESS_API_URL!,
          name: testResult.siteInfo.name,
          description: testResult.siteInfo.description,
          timezone: testResult.siteInfo.timezone,
          language: testResult.siteInfo.language,
          dateFormat: testResult.siteInfo.dateFormat,
          timeFormat: testResult.siteInfo.timeFormat,
          connected: true,
          lastTested: new Date().toISOString()
        };

        return NextResponse.json({
          hasDefaultSite: true,
          siteInfo,
          isDefault: true
        });
      } else {
        return NextResponse.json({
          hasDefaultSite: true,
          connected: false,
          error: testResult.error,
          isDefault: true
        });
      }
    } catch (error) {
      return NextResponse.json({
        hasDefaultSite: true,
        connected: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        isDefault: true
      });
    }

  } catch (error) {
    const apiError = handleAPIError(error, 'wordpress-sites-get');
    logError(apiError, { endpoint: '/api/wordpress/sites GET' });
    
    return NextResponse.json(
      createErrorResponse(apiError),
      { status: apiError.statusCode }
    );
  }
}