import { NextRequest, NextResponse } from 'next/server';

// Store request counts per IP address
const ipRequestCounts = new Map<string, { count: number, timestamp: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 100; // Max 100 requests per minute per IP

/**
 * API rate limiting middleware for Next.js
 * Can be used with Next.js middleware or directly in API routes
 */
export function rateLimitMiddleware(req: NextRequest) {
  // Get IP address
  const ip = req.ip || '127.0.0.1';
  const now = Date.now();
  
  // Clean up old entries every once in a while
  if (Math.random() < 0.01) { // 1% chance on each request
    cleanUpOldEntries(now);
  }
  
  // Get or initialize request data for this IP
  let requestData = ipRequestCounts.get(ip);
  if (!requestData || now - requestData.timestamp > RATE_LIMIT_WINDOW) {
    // If no previous request data or window has passed
    requestData = { count: 0, timestamp: now };
  }
  
  // Increment request count
  requestData.count++;
  ipRequestCounts.set(ip, requestData);
  
  // Check if rate limit exceeded
  if (requestData.count > MAX_REQUESTS_PER_WINDOW) {
    // Return 429 Too Many Requests
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  
  // Add rate limit headers
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - requestData.count);
  const reset = Math.ceil((requestData.timestamp + RATE_LIMIT_WINDOW - now) / 1000);
  
  // Only set headers and continue processing
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());
  
  return response;
}

/**
 * Clean up old entries from the IP request counts map
 */
function cleanUpOldEntries(now: number) {
  for (const [ip, data] of ipRequestCounts.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW) {
      ipRequestCounts.delete(ip);
    }
  }
} 