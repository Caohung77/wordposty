import { NextRequest, NextResponse } from 'next/server';
import { fileProcessor } from '@/lib/file-processor';
import { handleAPIError, logError, createErrorResponse } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        createErrorResponse(new Error('No files provided')),
        { status: 400 }
      );
    }

    console.log(`Processing ${files.length} files...`);

    // Process files
    const result = await fileProcessor.processFiles(files);

    return NextResponse.json({
      success: result.success,
      files: result.files,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const apiError = handleAPIError(error, 'upload-api');
    logError(apiError, { endpoint: '/api/upload' });
    
    return NextResponse.json(
      createErrorResponse(apiError),
      { status: apiError.statusCode }
    );
  }
}

// GET endpoint to return upload requirements
export async function GET() {
  return NextResponse.json({
    maxFileSize: '10MB',
    supportedTypes: ['.pdf', '.txt', '.md'],
    maxFiles: 10,
    acceptHeader: '.pdf,.txt,.md,text/plain,text/markdown,application/pdf'
  });
}