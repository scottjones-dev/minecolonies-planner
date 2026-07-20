# Deployment guide

The application is ready for a Node.js-compatible Next.js host. Vercel is the
shortest path because it detects the framework and deploys the contact route
without extra server configuration. Static-only hosting is not suitable: the
Resend contact form requires the `/api/contact` server route.

## 1. Prepare Resend

1. Create a Resend account and add a domain you own. A sending subdomain such
   as `updates.example.com` keeps product email separate from other mail.
2. Add the SPF and DKIM records Resend supplies to the domain's DNS, then wait
   for the domain to show as verified.
3. Create a sending-only API key for this project.
4. Choose the sender, recipient, and optional public contact address. The
   sender must belong to the verified domain, for example
   `MineColonies Planner <planner@updates.example.com>`.

Do not commit an API key or put it in a variable beginning with
`NEXT_PUBLIC_`.

## 2. Deploy on Vercel

1. Import `scottjones-dev/minecolonies-planner` into Vercel.
2. Keep the detected framework preset, build command (`pnpm build`), and output
   settings.
3. Add the variables below to Production, Preview, and Development as needed.
4. Deploy. Set `NEXT_PUBLIC_SITE_URL` to the final canonical HTTPS URL, then
   redeploy so the value is included in generated metadata.

| Variable | Required | Visibility | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public | Canonical production site, sitemap, robots, and social metadata URL |
| `RESEND_API_KEY` | Yes | Server only | Authorizes contact email delivery |
| `CONTACT_TO_EMAIL` | Yes | Server only | Inbox receiving form submissions |
| `CONTACT_FROM_EMAIL` | Yes | Server only | Display name and verified Resend sender |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | Public | Mailto address shown on the landing page |

Copy `.env.example` to `.env.local` for local contact-form testing. Next.js
loads root-level `.env*` files; `.env.local` is intentionally ignored by Git.

## 3. Production smoke test

Run the same release checks locally before deploying:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm build
pnpm start
```

After deployment, verify:

- `/` loads the landing page on phone and desktop widths.
- `/planner` opens the canvas and can place a Town Hall inside square chunks.
- `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, and the social image
  return successfully and contain the final deployment URL.
- A valid contact submission reaches `CONTACT_TO_EMAIL`, replies target the
  visitor, an invalid message is rejected, and repeated submissions are
  throttled.
- Browser refresh preserves a named plan and export/import still round-trips.
- Response headers include clickjacking, MIME-sniffing, referrer, and browser
  feature protections.

## Operational notes

- Plans remain in each visitor's browser; the server receives only contact
  messages.
- The in-process contact throttle is a lightweight abuse guard. For sustained
  public traffic, add durable rate limiting at the hosting edge.
- Rotate the Resend key immediately if it is exposed. Vercel environment
  changes require a new deployment to affect public build-time variables.
- Keep the pinned MineColonies and Structurize revisions documented in
  `docs/minecolonies-source.md` when refreshing generated catalogues.
