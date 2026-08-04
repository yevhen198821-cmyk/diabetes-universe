import Image from 'next/image';

import { BRAND_SYMBOL_ICON_SVG } from '../../lib/brand/brand-symbol-paths';

const sizeClassNames = {
  sm: 'size-10',
  md: 'size-11',
} as const;

export type BrandSymbolSize = keyof typeof sizeClassNames;

export interface BrandSymbolProps {
  readonly className?: string;
  readonly size?: BrandSymbolSize;
}

export function BrandSymbol({ className = '', size = 'md' }: BrandSymbolProps) {
  const dimension = size === 'sm' ? 40 : 44;

  return (
    <Image
      alt=""
      aria-hidden="true"
      className={`${sizeClassNames[size]} shrink-0 rounded-xl ${className}`.trim()}
      height={dimension}
      priority
      sizes={`${dimension}px`}
      src={BRAND_SYMBOL_ICON_SVG}
      unoptimized
      width={dimension}
    />
  );
}
