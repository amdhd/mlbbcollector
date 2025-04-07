import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware } from './lib/middleware/rateLimit';

// This middleware function is executed before any requests are processed
export function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return rateLimitMiddleware(request);
  }
  
  // For non-API routes, just continue
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
}; 