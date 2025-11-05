/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // ✅ This is what enables static export
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig