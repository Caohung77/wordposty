import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { handleAPIError, logError, createErrorResponse } from '@/lib/error-handler';

const JINA_API_KEY = process.env.JINA_API_KEY || 'jina_921018daa27142e8b5988b377227cc5003wnqysJwfT7LdK8hYgz0eGQ_QKN';
const JINA_BASE_URL = 'https://r.jina.ai';

// Handle URL extraction
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        createErrorResponse(new Error('URL parameter is required')),
        { status: 400 }
      );
    }

    console.log('Extracting content from URL using Jina AI:', url);

    const response = await axios.get(`${JINA_BASE_URL}/${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': JINA_API_KEY,
        'Accept': 'text/plain',
        'X-With-Generated-Alt': 'true'
      },
      timeout: 30000
    });

    let content = '';
    let title = url;
    let description = '';

    if (typeof response.data === 'string') {
      content = response.data;
      // Extract title from content (first line or first 100 chars)
      const lines = content.split('\n').filter(line => line.trim());
      title = lines[0]?.substring(0, 100) || url;
      description = content.substring(0, 160) + '...';
    } else {
      content = response.data.content || response.data.text || JSON.stringify(response.data);
      title = response.data.title || url;
      description = response.data.description || content.substring(0, 160) + '...';
    }

    if (!content || content.trim().length === 0) {
      throw new Error('No content could be extracted from this URL');
    }

    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

    console.log('Jina AI URL extraction successful:', {
      url,
      contentLength: content.length,
      wordCount
    });

    return NextResponse.json({
      success: true,
      data: {
        title: title.substring(0, 200),
        description: description.substring(0, 300),
        content,
        wordCount,
        url
      }
    });

  } catch (error) {
    const apiError = handleAPIError(error, 'jina-url-extract');
    logError(apiError, { endpoint: '/api/jina GET' });
    
    let errorMessage = 'Failed to extract content from URL';
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorMessage = 'Jina AI authentication failed. Please check your API key.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Jina AI rate limit exceeded. Please try again later.';
      } else if (error.response?.status === 404) {
        errorMessage = 'URL not found or cannot be accessed by Jina AI.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The URL might be too slow to respond.';
      }
    }

    return NextResponse.json(
      createErrorResponse(new Error(errorMessage)),
      { status: apiError.statusCode }
    );
  }
}

// Handle PDF file upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        createErrorResponse(new Error('PDF file is required')),
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        createErrorResponse(new Error('Only PDF files are supported')),
        { status: 400 }
      );
    }

    console.log('Processing PDF with Jina AI:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log('Using API key:', JINA_API_KEY ? `${JINA_API_KEY.substring(0, 10)}...` : 'NOT SET');

    // Create FormData for direct file upload to Jina AI
    const jinaFormData = new FormData();
    jinaFormData.append('file', file);

    console.log('Uploading PDF directly to Jina AI...');
    
    const response = await axios.post(JINA_BASE_URL, jinaFormData, {
      headers: {
        'Authorization': JINA_API_KEY,
        'Accept': 'text/plain',
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 second timeout for PDF processing
    });

    console.log('Jina AI response status:', response.status);
    console.log('Jina AI response type:', typeof response.data);

    let content = '';
    const data = response.data;
    
    if (typeof data === 'string') {
      content = data;
    } else if (data.content) {
      content = data.content;
    } else if (data.text) {
      content = data.text;
    } else {
      throw new Error('No content found in Jina AI response');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('No content could be extracted from this PDF. It might be image-based or encrypted.');
    }

    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

    console.log('Jina AI PDF extraction successful:', {
      filename: file.name,
      contentLength: content.length,
      wordCount
    });

    return NextResponse.json({
      success: true,
      data: {
        title: file.name,
        description: content.substring(0, 200) + '...',
        content,
        wordCount,
        filename: file.name,
        fileSize: file.size
      }
    });

  } catch (error) {
    const apiError = handleAPIError(error, 'jina-pdf-extract');
    logError(apiError, { endpoint: '/api/jina POST' });
    
    let errorMessage = 'Failed to extract PDF content';
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorMessage = 'Jina AI authentication failed. Please check your API key.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Jina AI rate limit exceeded. Please try again later.';
      } else if (error.response?.status === 413) {
        errorMessage = 'PDF file too large. Please try a smaller file.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid PDF file or unsupported format.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The PDF might be too large or complex.';
      }
    }

    return NextResponse.json(
      createErrorResponse(new Error(errorMessage)),
      { status: apiError.statusCode }
    );
  }
}