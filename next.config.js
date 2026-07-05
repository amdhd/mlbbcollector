/** @type {import('next').NextConfig} */
const nextConfig = {
  // Using static HTML export
  output: 'export',
  
  // Required to make Next.js static export work with images
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
  
  // Disable API routes for static export
  distDir: 'out',
  
  trailingSlash: false
}

module.exports = nextConfig 