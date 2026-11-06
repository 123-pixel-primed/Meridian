# Meridian scope (repo copy)

The full Master Scope lives as a doc: https://claude.ai/artifact/CsbkGduWtSN33vfXBGHegi
This file is the build summary for the repo. If the two disagree, the doc wins.

Last updated 6 November 2026.

## What Meridian is

One white-labelled platform for wellness and hospitality businesses, covering acquisition, booking, content, reviews, retention, loyalty, ads, messaging and an AI receptionist.

- **Engine:** GHL Agency Pro (CRM, journeys, email, SMS, WhatsApp, calendars, payments, POS, reputation, Ad Manager, Voice AI, white label). One flat agency fee, not per client.
- **Ours:** this repo on Netlify. Client dashboard, marketing plan engine, loyalty, partnerships network, growth audit, group layer for multi-site clients, integrations.
- **Intelligence:** Claude for research, copy, insights and audits. gpt-image-2 for imagery. geo-seo-claude plus OpenSEO with DataForSEO for website and AI visibility scores.
- **Dropped:** Klaviyo (once GHL is ready), Clay, Instantly, Expandi, Phantombuster, Make.com, Resend, HubSpot, Triffft, ManyChat, Supermetrics, Ahrefs, Semrush, Canva. Zapier only where a client already runs it.

## Who it serves

Day spas and bathhouses, wellness service businesses (new or growing), retreat facilitators, B2B partnerships, product brands seeking stockists and venue hire. From solo operators to 250-venue groups. Every location is its own GHL sub-account; the repo's group layer rolls them up.

## Plans

Prices are per location per month (AUD). Every plan can be run by the client or run for them by our team; management is not a plan.

| Plan | Price | Focus |
| --- | --- | --- |
| Core | $390 | Keeping the guests you have: bookings, payments, vouchers, guest journeys, reviews, memberships and loyalty, one inbox, baseline growth audit, dashboard |
| Growth | $790 | Core plus new guests: marketing plan from goals, outreach, corporate wellness and partnerships, content, Google and AI visibility, monthly growth audit, weekly next step |
| Scale | $1,490 plus ad spend | Growth plus media: ads run and refined, content produced in the client's style, booking attribution, monthly strategy session |

Core is retention and booking, not acquisition. A business that only wants to keep its guests buys Core; acquisition starts at Growth.

Add-ons: AI receptionist ($200 to $300 a month), data migration (from $1,500), website build (quoted later).

Live site prices still differ ($500 and $1,000 tiers). The homepage branch must not merge until the new prices are confirmed.

## Dashboard by plan

Set in `app/app.js` (`TIER_SCREENS`).

| Screen | Core | Growth | Scale |
| --- | --- | --- | --- |
| Overview | Yes | Yes | Yes |
| Messages | Yes | Yes | Yes |
| Bookings | Yes | Yes | Yes |
| Returning guests | Yes | Yes | Yes |
| Reviews | Yes | Yes | Yes |
| Growth audit | Baseline | Monthly | Monthly |
| Plan and goals | | Yes | Yes |
| New guests | | Yes | Yes |
| Content | | Yes | Yes |
| Website | | Yes | Yes |
| Partners | | Yes | Yes |
| Ads | | | Yes |

Screens outside a client's plan stay in the menu with a plan badge and open an upgrade card instead of data. Overview stats, activity and "Waiting for you" items are filtered the same way. The demo has a plan switcher so prospects can compare; a real client's plan comes from their account.

## Growth audit in the platform

The Pixel Primed growth audit is each client's day-one baseline. Core clients see that baseline score with the top next actions. Growth and Scale clients see the audit re-run monthly against the baseline, section by section, with a downloadable report.

## Forms

| Form | Path | Netlify form name | Purpose |
| --- | --- | --- | --- |
| Onboarding | /onboard/ | meridian-onboarding | New clients: business, goals, treatments and booking, brand, reviews, connections |
| Book a demo | /book-a-demo/ | meridian-demo-request | Prospects asking for a walkthrough |
| Pricing gate | / (homepage) | Klaviyo list, kept until GHL is ready | Unlocks the plans on the homepage |

Later, a serverless function turns an onboarding submission into a GHL sub-account, writes fields and media. Claude then builds a brand profile the client can edit on a Brand page. The favourite photo becomes the dashboard header.

## Messaging

GHL handles SMS and WhatsApp. Branded SMS sender names must be on the ACMA Sender ID Register. WhatsApp is a $10 a month add-on per sub-account plus Meta fees, rebilled to clients. Every channel shows in one Messages screen.

## Rules for this repo

- No API keys or private keys in the repo. Keys go in Netlify environment variables.
- Work on branches; `main` is live.
- Client copy: no em dashes, italics or exclamation marks; no comma before or after "and"; no third-party tool names; no jargon such as prospects, pipeline, campaign or ICP; no fabricated testimonials.
- Design: cream and white backgrounds, no dark sections, Playfair headings, Inter body, teal #5F8F88.

## Open items

- Confirm new prices before the homepage branch merges.
- Decide whether onboard.pixelprimed.com redirects to /onboard/.
- Upload the 10 missing journey photos (welcome 1 to 4, win back 1 to 3, loyalty 1 to 3).
- GHL Agency Pro access and API key for the sandbox and the Hepburn booking and gift card test.
- Check Netlify form detection is on so both forms collect submissions.
