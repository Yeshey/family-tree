# Family Tree

https://yeshey.github.io/family-tree

Interactive family tree, built with [family-chart](https://github.com/donatso/family-chart) + Vite + TS.

**Live site:** https://Yeshey.github.io/family-tree

## Develop

```bash
direnv allow   # or: nix develop
npm install
npm run dev
```

## Edit the tree

Edit `public/data.json`, or use the in-app editor (pencil icon on each card) — click "Export" there to grab updated JSON.

Data format:

```json
{
  "id": "1",
  "data": { "first name": "John", "last name": "Doe", "birthday": "1980", "gender": "M" },
  "rels": { "spouses": ["2"], "children": ["3"] }
}
```

## Deploy

```bash
npm run deploy
```

Pushes `dist/` to `gh-pages` branch. Settings → Pages → Source: `gh-pages` / root.