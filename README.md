# Spotlight Security — Static Site Clone

A 1:1 static clone of [spotlightsecurity.ai](https://spotlightsecurity.ai/), rebuilt from
the WordPress export in plain HTML/CSS/JS — no build step, no framework, hosts anywhere.

## Pages

| File               | Page                                   |
| ------------------ | -------------------------------------- |
| `index.html`       | Home (hero, threat stats, why-Spotlight, 4 stages, industries preview, pricing, CTA) |
| `platform.html`    | Platform — "How it Works" (7 steps)    |
| `industries.html`  | Industries (5 tabbed sectors + local-gov deep dive) |
| `about.html`       | About (mission, problem, credibility, principles) |

## Structure

```
assets/
  css/style.css     — full design system (colors, type, components, responsive)
  js/main.js        — sticky header, mobile menu, scroll reveals, count-up stats,
                       industry tabs, animated hero terminal, posture bar
  img/              — logos (logo-header.png = gradient shield + white wordmark),
                       favicon, dot.svg
```

Source material (WordPress XML export, the code + screenshot docs, original logo PNGs)
is kept at the project root for reference and is not used by the site itself.

## Design tokens (pulled from the live site)

- Background `#0d1030` · text white · muted `rgba(255,255,255,.64)`
- Accent gradient `#ff7130 → #cf4066`; heading highlight `#db332d → #ff7130 → #cf4066`
- Fonts: **Montserrat** (900 display / 400–700 body), **JetBrains Mono** (labels, terminals)

## Run locally

```bash
python3 -m http.server 8891
```

Then open <http://127.0.0.1:8891/>. (Any static file server works; relative asset
paths mean it can also be dropped onto Netlify, GitHub Pages, S3, or any web host.)

## Deploy (GitHub Pages)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which publishes the
repo contents straight to GitHub Pages — **no build step** (it's plain static
files). The site serves at the project sub-path
`https://spotlight-security-ai.github.io/spotlight-website/`.

Because every internal link is relative, the same files work unchanged if you
later move to the apex domain `spotlightsecurity.ai` — just add a `CNAME` file
and point DNS.

## Notes

- "Book a Demo" links point to the same Google Form the original uses.
- "Talk to the Team" / contact links use `mailto:sales@spotlightsecurity.ai`.
- All interactivity from the original is reproduced (terminal typing, counters,
  tabs, hover states, scroll-in animations).
