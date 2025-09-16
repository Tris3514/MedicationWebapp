/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/MedicationWebapp' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/MedicationWebapp' : ''
}

module.exports = nextConfig
