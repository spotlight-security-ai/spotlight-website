// @ts-check
import { defineConfig } from 'astro/config';

// `base` and `site` are driven by env vars so the same source builds for:
//   - local dev:              base '/'                       (default)
//   - GitHub Pages preview:   base '/spotlight-website'      (set in CI)
//   - apex domain cutover:    base '/', site spotlightsecurity.ai
// Internal links use the url() helper (src/lib/url.ts) so they respect `base`.
export default defineConfig({
  site: process.env.SITE || 'https://spotlightsecurity.ai',
  base: process.env.BASE_PATH || '/',
  build: { inlineStylesheets: 'auto' },
});
