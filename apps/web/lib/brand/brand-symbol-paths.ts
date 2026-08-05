export const APP_BASELINE_DESCRIPTION =
  'Diabetes Universe — a digital companion for people living with diabetes.';

export const BRAND_SYMBOL_ICON_SVG = '/brand/app-icon/app-icon-dark.svg';

export const BRAND_SYMBOL_ICON_PNG = '/brand/app-icon/app-icon-dark-1024.png';

export const BRAND_SYMBOL_ICON_192 = '/brand/app-icon/app-icon-192.png';

export const BRAND_SYMBOL_ICON_512 = '/brand/app-icon/app-icon-512.png';

export const BRAND_SYMBOL_ICON_MASKABLE_512 =
  '/brand/app-icon/app-icon-maskable-512.png';

export const BRAND_SYMBOL_APPLE_TOUCH_ICON =
  '/brand/app-icon/apple-touch-icon-180.png';

export const BRAND_SYMBOL_MANIFEST_ICONS = [
  {
    src: BRAND_SYMBOL_ICON_192,
    sizes: '192x192',
    type: 'image/png',
    purpose: 'any',
  },
  {
    src: BRAND_SYMBOL_ICON_512,
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any',
  },
  {
    src: BRAND_SYMBOL_ICON_MASKABLE_512,
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  },
] as const;
