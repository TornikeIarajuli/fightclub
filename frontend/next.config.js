/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed static export for proper client-side routing
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
