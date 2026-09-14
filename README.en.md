[繁體中文](README.md) ｜ [简体中文](README.zh-CN.md) ｜ [English](README.en.md)

# ColorWalk · 色彩漫步

Turn a walk into a color-collecting game: choose a palette and matching tolerance, capture colors, then save a card and revisit the archive. Live app: https://color-walk-sable.vercel.app.

## Start here

Install Node.js 22.12+ LTS, download the repository, extract it and open a terminal in the folder containing package.json. Then run:

```sh
npm ci
npm run dev
```

Keep that terminal open. Open the address it prints in your browser. Press Ctrl+C in the terminal to stop.

Choose a theme and matching rules, then allow camera access. localhost supports camera access; public hosting requires HTTPS. Photos use browser-local storage, so clearing site data removes archives. Optional Supabase configuration supports statistics; production permissions require separate verification. The README language links do not imply every UI string has passed localization testing. Commercial use requires authorization.

## Where to read or change code

| File | Purpose |
|---|---|
| `src/App.jsx` | Navigation, walk flow and data migration |
| `src/pages` | Feature screens |
| `src/utils/colorUtils.js` | Color-matching rules |
| `src/utils/i18n.js` | Interface translations |
| `src/utils/storage.js` | Local photo storage |

## Check a change

Run `npm run lint` for the configured type check and `npm run build` for a production build. A passing check does not verify camera permissions, storage recovery or every screen.

## Detailed reference

[Original guide](README.original.md) preserves earlier details and attribution in its original language. Some statements describe an older version; use current source code and this entry guide to resolve differences.
