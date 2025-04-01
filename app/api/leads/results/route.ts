import { NextResponse } from 'next/server';

export async function GET() {
  // In a real application, this would generate an Excel file with results
  // For now, we'll just return a dummy text file
  const dummyContent = 'This would be an Excel file with lead upload results';
  
  return new NextResponse(dummyContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="lead_upload_results.xlsx"',
    },
  });
} 