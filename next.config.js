/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@pinecone-database/pinecone']
  }
}

module.exports = nextConfig
