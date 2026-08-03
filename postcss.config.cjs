// Empty local PostCSS config.
// This exists to stop Vite from walking up into the parent repo's
// postcss.config.js (which pulls in Tailwind we don't use here).
module.exports = { plugins: [] };
