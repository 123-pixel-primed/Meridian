# Meridian by Pixel Primed

Marketing homepage for Meridian, live at https://meridian.pixelprimed.com

- `index.html` is the whole page. Fonts load from Google Fonts and the photos are built into the file, so no other files are needed.
- Pricing sign-ups go to Klaviyo (public key `TheXup`). Set `KLAVIYO_LIST_ID` near the bottom of `index.html`. Until it is set, sign-ups go to the HubSpot newsletter form.
- Never add a private Klaviyo key (starting `pk_`) to this repository.

## Deploying

Connect this repository to the `meridianbypixelprimed` Netlify project (no build command, publish directory `.`). Every push to `main` then deploys automatically.
