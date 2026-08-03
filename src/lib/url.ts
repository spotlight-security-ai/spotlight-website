// Base-path-aware URL builder.
//
// GitHub Pages serves a project site under a sub-path (e.g. /spotlight-website/),
// while the eventual apex domain (spotlightsecurity.ai) serves from root (/).
// Astro exposes the configured base as import.meta.env.BASE_URL, but it does NOT
// rewrite raw href="/..." attributes — so we prefix them ourselves.
//
// Usage:  <a href={url('/platform/')}>  ->  '/platform/' or '/spotlight-website/platform/'
//         url('/')  ->  '/' or '/spotlight-website/'
const BASE = import.meta.env.BASE_URL; // always has a trailing slash

export function url(path = '/'): string {
  const b = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}` || '/';
}
