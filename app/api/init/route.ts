// app/api/init/route.ts
// Server-side initialization endpoint

import { initializeApp } from '@/lib/app-init';
import { NextResponse } from 'next/server';

// Initialize the app when this module is loaded
(async () => {
  console.log('Server-side initialization starting...');
  try {
    await initializeApp();
    console.log('Server-side initialization complete');
  } catch (error) {
    console.error('Error during server-side initialization:', error);
  }
})();

// API route handler (optional - just returns initialization status)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Application initialization route loaded'
  });
} 