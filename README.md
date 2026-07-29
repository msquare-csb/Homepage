# M-Square Lab Website (Local Draft)

A clean, data-driven lab website starter built with Next.js (App Router) and configured for static export.

## Requirements
- Node.js 18.18+ (or newer)
- npm

## Run locally
```bash
npm install
npm run dev
```
Open: http://localhost:3000

## Build (static export)
```bash
npm run build
```
Output: out/

## Edit content
- Home page text, hero slides, focus groups: `data/home.json`
- News: `data/news.json`
- Members and alumni career data: `data/members.json`
- Member section order and alumni career labels: `data/member-sections.json`
- PI profile: `data/pi.json`
- Research topic detail pages: `data/research.json`
- Research overview section layout: `data/research-sessions.json`
- Publications: `data/publications.json`
- Research tools and publication year filters: `data/outcomes.json`
- Activities: `data/activities.json`
- Navigation menu: `data/navigation.json`
- Static assets: `public/`

## Check changes
```bash
npm test
npm run build
```

Use the npm scripts rather than calling `next dev` or `next build` directly. The scripts keep development and production build caches separate so local preview does not break while checking a production build.
