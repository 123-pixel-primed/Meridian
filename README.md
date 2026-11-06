# Meridian by Pixel Primed

One repository for everything Meridian: the marketing homepage, the public demo, the onboarding form and the client app.

| Folder | What it is | Address |
| --- | --- | --- |
| `index.html` | Marketing homepage | https://meridian.pixelprimed.com |
| `demo/` | Click-through demo with sample data. Safe for anyone to explore: no logins, no live connections | /demo |
| `onboard/` | Onboarding form for new clients | /onboard |
| `app/` | The client dashboard. The demo runs the same screens with sample data | /app (not live yet) |

## Homepage pricing form

Pricing sign-ups are saved to the `meridian-pricing` form in Netlify Forms (Netlify project, Forms tab). They will be forwarded to the CRM once it is connected. To see the form again after submitting, visit `/?showform`.

## Rules

- Never commit an API key or private key. Keys live in Netlify environment variables.
- Client-facing copy never names the tools behind Meridian.
- Light backgrounds only, Playfair Display headings, Inter body, teal `#5F8F88`, no italics.

## Deploying

Connect this repository to the `meridianbypixelprimed` Netlify project (no build command, publish directory `.`). Every push to `main` deploys automatically. Work in progress goes on other branches so nothing reaches the live site until it is merged.
