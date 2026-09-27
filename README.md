# Postly · Google Bootcamp

A LinkedIn post generator built with **Next.js App Router, React, and strict TypeScript**, powered by Gemini 3.5 Flash-Lite.

## Local development

Requires Node.js 22 or newer.

```sh
npm install
cp .env.example .env.local
# Set GEMINI_API_KEY in .env.local
npm run dev
```

Open http://localhost:3000.

```sh
npm run build     # Next.js production build with TypeScript validation
npm start         # Serve the production build
npm test          # Interaction, sharing, and server-route tests
npm run typecheck
```

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Keep the automatically detected **Next.js** framework preset and the repository root directory. Use Node.js 22 or newer.
3. Add `GEMINI_API_KEY` in **Settings → Environment Variables**, selecting the environments where you want generation enabled. Use your Google AI Studio key.
4. Optionally add `GEMINI_MODEL=gemini-3.5-flash-lite` (this is already the default).
5. Deploy. Redeploy after changing environment variables.

**Do not prefix the key with `NEXT_PUBLIC_`.** Do not paste it into source files, `next.config.ts`, or frontend settings. `.env` and `.env.*` are ignored by Git; `.env.example` contains placeholders only. Your local `.env` is not uploaded by GitHub import; configure the key in Vercel separately.

The browser calls `/api/generate`. Only the Next.js server route reads the key and calls Google. The route imports `server-only`, returns only validated post text, and uses generic errors rather than forwarding Google's response bodies. No API key is sent to the browser or included in public client bundles.

Vercel Functions have a 4.5 MB request-body limit. Before generation, larger uploads are resized and compressed into bounded analysis copies, keeping four images below the limit. Original files remain available for sharing. The route allows 60 seconds, with a 50-second upstream timeout. No Express process, persistent server, filesystem writes, or external image storage is required.

The generation route is a public endpoint. Keeping the key private does not prevent visitors from consuming its quota. For a public multi-user deployment, add authentication/rate limits or use Vercel deployment protection and set appropriate Google API quotas.

## Features

- Up to four JPG, PNG, or WebP uploads, each up to 5 MB, with drag-and-drop.
- Images used to understand your experience rather than write a photo description.
- Perspectives for attending, building, presenting, organizing, learning, milestones, and team moments.
- Organization, event, audience, tone, length, language, hashtags, mentions, calls to action, emoji preferences, and extra context.
- Three editable variations, shorter revisions, and stronger opening hooks.
- LinkedIn-style preview with a profile header, blue hashtags, expandable post text, and image layouts based on the first photo's orientation.
- Templates, profile personalization, browser-local saved drafts, copying, and text downloads.

## LinkedIn handoff

**Open in LinkedIn** passes the selected edited post text to LinkedIn's web composer and copies it as a fallback. This action is text-only, even when reference images have been uploaded. Images stay available for AI generation and in the local preview; they are not transferred to LinkedIn.

LinkedIn may discard prefilled text during sign-in; paste the copied text if needed. Mentions are plain text until resolved to accounts in LinkedIn. Review and publish the post there; the app does not publish automatically.

Drafts save text and form context in this browser. Uploaded images remain in memory and must be reattached after reloading. Review generated facts before publishing.

## Verification

`npm test` checks generation, errors, editing, saving/reopening drafts, context and tone selection, Unicode text handoff, text-only handoff with reference images, input limits, and server credential isolation. External services are mocked in automated tests. Live Gemini text and image generation were also checked during development. Visual browser inspection requires a connected browser.

## References

- [Next.js server environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Vercel Function limits](https://vercel.com/docs/functions/limitations)
- [LinkedIn photo upload and layout behavior](https://www.linkedin.com/help/linkedin/answer/a527229/share-photos-or-videos)
