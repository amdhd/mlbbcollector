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
        hostname: '**',
      },
    ],
  },
  
  // Disable API routes for static export
  distDir: 'out',
  
  trailingSlash: true
}

module.exports = nextConfig 