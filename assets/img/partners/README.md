# Partner / recognition logos

Drop the official logo files here using these exact names (SVG preferred, or
transparent PNG @2x — roughly 200×80px or larger):

| File                      | Program                                            | Status      |
| ------------------------- | -------------------------------------------------- | ----------- |
| `nvidia-inception.svg`    | NVIDIA Inception Program                            | Member      |
| `aws-activate.svg`        | AWS Activate for Startups                           | Member      |
| `openai.svg`              | OpenAI Cybersecurity Grant                          | Recipient   |
| `t-challenge.svg`         | Deutsche Telekom / T-Mobile 2026 T-Challenge        | Finalist    |
| `masschallenge.svg`       | MassChallenge 2025 Security & Resiliency Accelerator| Participant |
| `black-hat.png`           | Black Hat SecTor 2026 Startup Spotlight Competition | Finalist    |
| `oasis-collective.svg`    | Oasis Collective Women in AI Pitch Competition      | Winner      |

Notes
- **Monochrome / white versions are ideal** for the dark theme. If you only have
  full-color logos, that's fine — hand them over and I'll either use them as-is or
  apply a white treatment so they sit cohesively on the navy background.
- `.png` is fine too — just keep the same base name (e.g. `aws-activate.png`).
- Once the files are here, I'll swap the current stylized vector emblems in
  `index.html` for these real logos and push to `main` (which deploys to Pages).
- The Oasis Collective entry currently uses a typeset wordmark (`.partner__logo--text`
  in `index.html`). Drop the official logo here as `oasis-collective.svg` (or `.png`)
  and swap that span for an `<img class="partner__logo">` like the other entries.
