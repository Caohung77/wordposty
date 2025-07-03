import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    // Security: Only allow files that start with 'temp-' and have safe characters
    if (!filename.startsWith('temp-') || !/^temp-\d+-[\w.-]+\.pdf$/i.test(filename)) {
      return new NextResponse('Invalid filename', { status: 400 });
    }
    
    const filePath = path.join('/tmp', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Return the PDF file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Error serving temporary file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}