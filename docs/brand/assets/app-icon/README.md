# Official App Icon Assets

## Status

**Ready for Final Visual Review**

## Approved Visual Direction

Production assets implement the project-owner approved visual reference:

- clear letter **D** and letter **U** with equal visual height;
- DNA double helix flowing smoothly between the letters;
- deep navy background on dark and master variants;
- white-to-blue metallic gradient treatment on symbol geometry;
- strict but soft visual character;
- no additional text, labels, watermarks, or mockup framing inside the icon.

This direction is an approved visual exception to abstract-only rules in
[06 Logo Architecture Specification](../../06-logo-architecture-specification.md)
and gradient restrictions in
[14 App Icon Architecture Specification](../../../design-system/14-app-icon-architecture-specification.md).
Geometry and composition follow the approved reference; do not redesign the
`D`, `U`, or DNA structure without owner approval.

## Asset Files

| File                            | Description                                                      |
| ------------------------------- | ---------------------------------------------------------------- |
| `app-icon-master.svg`           | Primary SVG source — deep navy background, light gradient symbol |
| `app-icon-dark.svg`             | Dark variant — deep navy background, light gradient symbol       |
| `app-icon-light.svg`            | Light variant — light neutral background, dark navy/blue symbol  |
| `app-icon-transparent.svg`      | Symbol only — transparent background                             |
| `app-icon-master-1024.png`      | Master raster export at 1024×1024                                |
| `app-icon-dark-1024.png`        | Dark raster export at 1024×1024                                  |
| `app-icon-light-1024.png`       | Light raster export at 1024×1024                                 |
| `app-icon-transparent-1024.png` | Transparent raster export at 1024×1024                           |

### Repository Locations

- **Production:** `apps/web/public/brand/app-icon/`
- **Documentation previews:** `docs/brand/assets/app-icon/` (mirrors production assets)

SVG is the primary source. PNG files are derived exports for platform delivery.

## Variants and Usage

| Variant           | Background                | Symbol                 | Use when                                                |
| ----------------- | ------------------------- | ---------------------- | ------------------------------------------------------- |
| **Master / Dark** | Deep navy (`#0A1628`)     | White-to-blue gradient | Default app launcher, store listings, dark UI chrome    |
| **Light**         | Light neutral (`#F3F6FA`) | Navy-to-blue gradient  | Light UI surfaces, documentation, light-themed contexts |
| **Transparent**   | None                      | White-to-blue gradient | Overlays, compositing, adaptive icon foreground layers  |

Dark and light variants share identical vector geometry; only fill colors and
background differ.

## Technical Requirements

- **Canvas:** 1024×1024 user units (`viewBox="0 0 1024 1024"`).
- **Safe area:** Symbol geometry is inset within a 112 px margin on all sides
  (~11% of canvas) for iOS and Android mask compatibility.
- **Minimum display size:** 48×48 px for launcher recognition; validate legibility
  at 32×32 px before shipping to constrained contexts.
- **Format rules:** All paths are vector; gradients are editable `linearGradient`
  definitions; no embedded raster images inside SVG.
- **Regeneration:** `node scripts/brand/generate-app-icon-assets.mjs` (requires
  Python 3 with `cairosvg` for PNG export).

## Governance

- Architectural rules:
  [14 App Icon Architecture Specification](../../../design-system/14-app-icon-architecture-specification.md)
- Brand context:
  [05 Brand Architecture Specification](../../05-brand-architecture-specification.md),
  [09 Brand Book](../../09-brand-book.md)

## Lifecycle

| Stage                               | Status                            |
| ----------------------------------- | --------------------------------- |
| Architecture specification (doc 14) | Feature Complete                  |
| Official production assets          | **Ready for Final Visual Review** |
| Platform store submission exports   | Pending final visual approval     |
