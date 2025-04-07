# Rate Limiting for MLBB Collector Tracker

This application implements a multi-layered rate limiting strategy to prevent abuse and provide protection against DDoS attacks.

## Rate Limiting Layers

### 1. Firestore Security Rules Rate Limiting

The Firestore database is protected by security rules that implement rate limiting for different types of operations:

- **Profile Updates**: Limited to 1 request every 10 seconds per user
- **Collection Updates**: Limited to 1 request every 3 seconds per user
- **Other Write Operations**: Default limit of 1 request every 5 seconds per user

The implementation uses Firestore's built-in timestamp comparison to enforce these limits.

### 2. Client-Side Rate Limit Tracking

When writing to the database, the application tracks timestamps in a dedicated `rateLimits` collection, which works in tandem with the Firestore Security Rules to enforce the rate limits.

### 3. API Route Rate Limiting

The application includes a Next.js middleware that applies rate limiting to all API routes:

- **Limit**: 100 requests per minute per IP address
- **Response**: When the limit is exceeded, the API returns a 429 status code with a "Retry-After" header

## How It Works

1. **Database Operations**:
   - When a user tries to save their profile or collection, the application first updates a timestamp in the `rateLimits` collection
   - The Firestore Security Rules check this timestamp against the last recorded timestamp for that operation
   - If the time difference is less than the allowed window, the operation is rejected

2. **API Requests**:
   - The middleware tracks requests per IP address using an in-memory map
   - Each request increments a counter for that IP
   - When the counter exceeds the limit, requests are rejected with a 429 status
   - The counter resets after the specified time window (1 minute)

## Headers

API responses include the following headers:

- `X-RateLimit-Limit`: The maximum number of requests allowed in the window
- `X-RateLimit-Remaining`: The number of requests remaining in the current window
- `X-RateLimit-Reset`: The time in seconds until the window resets

## Important Notes

- Firebase Hosting already provides some DDoS protection at the network level
- This rate limiting implementation focuses on application-level protection
- In-memory rate limiting for API routes will reset if the server restarts - for production, consider using a persistent store like Redis 