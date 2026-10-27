# Meridian by Pixel Primed

Marketing homepage for Meridian, live at https://meridian.pixelprimed.com

- `index.html` is the whole page. Fonts load from Google Fonts and the photos are built into the file, so no other files are needed.
- Pricing sign-ups go to the Klaviyo "Meridian Pricing" list (public key `TheXup`, list `Uc43nb`), tagged with the source "Meridian pricing". To see the form again after submitting, visit `/?showform`.
- Never add a private Klaviyo key (starting `pk_`) to this repository.

## Deploying

Connect this repository to the `meridianbypixelprimed` Netlify project (no build command, publish directory `.`). Every push to `main` then deploys automatically.
