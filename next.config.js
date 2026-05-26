/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prevent Next.js from bundling these Node.js-only packages.
  // They are required at runtime via Node's native require instead.
  serverExternalPackages: ['pdf-parse', 'mammoth', 'pptxgenjs', 'pdfjs-dist'],
};

module.exports = nextConfig;
