# App Icon Assets (Web)

Official DU + DNA Brand Symbol assets served from `apps/web/public/brand/app-icon/`.

## PWA and platform exports

| File                        | Size    | Purpose                        |
| --------------------------- | ------- | ------------------------------ |
| `app-icon-192.png`          | 192×192 | PWA launcher (`any`)           |
| `app-icon-512.png`          | 512×512 | PWA launcher (`any`)           |
| `app-icon-maskable-512.png` | 512×512 | PWA adaptive icon (`maskable`) |
| `apple-touch-icon-180.png`  | 180×180 | Apple Touch Icon               |

## Source and regeneration

- SVG master: `app-icon-dark.svg` (approved DU + DNA geometry)
- Regenerate: `node scripts/brand/generate-app-icon-assets.mjs` (requires Python 3 + `cairosvg`)
- Documentation mirror: `docs/brand/assets/app-icon/`

## References

- Web manifest: `apps/web/public/manifest.webmanifest`
- Next.js metadata: `apps/web/app/layout.tsx`
