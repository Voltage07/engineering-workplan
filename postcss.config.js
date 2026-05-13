// ==========================================================
// postcss.config.js
// ==========================================================
// PostCSS is the tool that processes your CSS files.
// Tailwind CSS runs as a PostCSS plugin — without this file,
// Tailwind classes won't work at all.
// This file MUST exist in the project root.
// ==========================================================

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // autoprefixer automatically adds vendor prefixes like -webkit-
    // so your CSS works in older browsers too.
  },
}
