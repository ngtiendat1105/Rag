/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig