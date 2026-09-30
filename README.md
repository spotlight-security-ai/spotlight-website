# Spotlight Security — Static Site Clone

A 1:1 static clone of [spotlightsecurity.ai](https://spotlightsecurity.ai/), rebuilt from
the WordPress export in plain HTML/CSS/JS — no build step, no framework, hosts anywhere.

## Pages

| File               | Page                                   |
| ------------------ | -------------------------------------- |
| `index.html`       | Home (hero, threat stats, why-Spotlight, 4 stages, industries preview, pricing, CTA) |
| `platform.html`    | Platform — "How it Works" (7 steps)    |
| `industries.html`  | Industries (5 tabbed sectors + local-gov deep dive) |
| `about.html`       | About (mission, problem, credibility, team & advisors, principles) |
| `contact.html`     | Book a Demo / contact — embedded Pipedrive lead form |

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
paths mean it can be dropped onto Netlify, S3, or any web host.)

## Deploy (Netlify)

Hosted on Netlify, deployed from `main` — **no build step** (plain static files).
Config lives in `netlify.toml`: publish directory `.`, 301 redirects for legacy
WordPress paths (`/platform/` → `/platform.html`, etc.), `www` → apex canonical
redirect, and security headers. A branded `404.html` is served on not-found.

Production domain: `spotlightsecurity.ai` (apex), DNS at Namecheap pointing at
Netlify (A/ALIAS on `@`, CNAME on `www`). HTTPS is auto-provisioned by Netlify.

## Dashboard sign-in clips (`media/dashboard/`)

The dashboard's sign-in page (`dashboard.spotlightsecurity.ai/signin`, in `ui-repo`)
plays the clips listed in `media/dashboard/clips.json`. Each entry has a `title`,
`caption`, `src` (MP4) and `poster` (still shown while loading); paths are relative
to `clips.json`. To replace or add a clip, change the files and the list here and
merge: the dashboard picks it up without its own deploy. Keep clips short, muted,
recorded on a demo account (no customer hostnames or IPs), and encoded like this:

```bash
ffmpeg -ss START -t LENGTH -i recording.mp4 -an \
  -vf "setpts=PTS/SPEEDUP,fps=24,scale=1440:-2:flags=lanczos,setsar=1" \
  -c:v libx264 -preset slow -crf 27 -profile:v main -pix_fmt yuv420p \
  -movflags +faststart clip.mp4
ffmpeg -ss FRAME_TIME -i recording.mp4 -frames:v 1 -vf "scale=1440:-2,setsar=1" -q:v 4 clip.jpg
```

`netlify.toml` sends `Access-Control-Allow-Origin: *` for `/media/dashboard/*` so the
dashboard (a different subdomain) can read `clips.json`.

## Notes

- All "Book a Demo" / "Contact Sales" / "Talk to the Team" / "Request an Assessment"
  CTAs link to `contact.html`, which embeds the Pipedrive web form (lead form).
  The visible `sales@spotlightsecurity.ai` address in the footer stays a `mailto:`.
- Every page loads the Pipedrive LeadBooster chatbot from `<head>` (config +
  async loader snippet, just before `</head>`).
- All interactivity from the original is reproduced (terminal typing, counters,
  tabs, hover states, scroll-in animations).
