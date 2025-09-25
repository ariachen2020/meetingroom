/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  output: 'standalone',
}

module.exports = nextConfig