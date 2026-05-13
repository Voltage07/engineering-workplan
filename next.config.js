// ==========================================================
// next.config.js
// ==========================================================
// Renamed from next.config.ts — Next.js 14 does not support
// .ts config files. Use .js or .mjs instead.
// ==========================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig