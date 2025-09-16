/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/MedicationWebapp' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/MedicationWebapp' : ''
}

module.exports = nextConfig
