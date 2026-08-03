# Spotlight Security — website (Astro rebuild)

A clean, static rebuild of [spotlightsecurity.ai](https://spotlightsecurity.ai),
migrating off WordPress/Elementor to editable Astro source files.

Design tokens (colors, fonts) were extracted 1:1 from the WordPress Elementor
global kit, so the brand system matches the original.

## Status

- [x] **Foundation** — design tokens, shared Header + Footer, base layout
- [x] **Home page** — hero, threat-landscape stats, why-Spotlight, pricing teaser, demo CTA
- [ ] Platform page (7-step animated walkthrough)
- [ ] Industries page
- [ ] About page
- [ ] Real logo/favicon assets (see `public/brand/README.md`)

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview
```

## Structure

| Path | What |
|------|------|
| `src/styles/global.css` | Design tokens (brand colors, fonts) + base styles |
| `src/layouts/Layout.astro` | Page shell (head, header, footer, scroll reveals) |
| `src/components/` | Header, Footer, StatCounter |
| `src/pages/index.astro` | Home page |
| `public/brand/` | Drop real logo exports here |

Fonts (Roboto, Roboto Slab, JetBrains Mono) are self-hosted via `@fontsource`
— no external network requests.
