# Brand assets

Drop the real logo files exported from WordPress here, then update the
references in `src/components/Header.astro` and `Footer.astro`.

Files referenced by the live WP site (`wp-content/uploads/2026/03/`):

| File | Use |
|------|-----|
| `2SS_Horizontal_white.png` | White horizontal wordmark (header on dark) |
| `SS_Horizontal_Gwhite.png` | Grey/white wordmark variant |
| `2SS_Horizontal.png`       | Full-color horizontal wordmark |
| `2SS_Horizontal_black.png` | Black wordmark (for light backgrounds) |
| `spotlight-dot.svg`        | Standalone dot mark |
| `spotlight-favicon.png`    | Favicon |

Until those are added, the header/footer render a CSS wordmark placeholder
("Spotlight" + orange dot) that matches the brand colors.
