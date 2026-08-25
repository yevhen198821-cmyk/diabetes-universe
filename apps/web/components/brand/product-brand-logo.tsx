import Image from 'next/image';

import {
  PRODUCT_BRAND_LOGO_INTRINSIC_SIZE,
  PRODUCT_BRAND_LOGO_PATH,
} from '../../lib/brand/brand-symbol-paths';

const sizeClassNames = {
  auth: 'size-14',
  header:
    'h-[4.5rem] w-[4.5rem] shrink-0 object-contain sm:h-[5.25rem] sm:w-[5.25rem] lg:h-24 lg:w-24',
} as const;

export type ProductBrandLogoVariant = keyof typeof sizeClassNames;

export interface ProductBrandLogoProps {
  readonly className?: string;
  readonly priority?: boolean;
  readonly variant?: ProductBrandLogoVariant;
}

export function ProductBrandLogo({
  className = '',
  priority = false,
  variant = 'header',
}: ProductBrandLogoProps) {
  const dimension = variant === 'auth' ? 56 : 96;

  return (
    <Image
      alt=""
      aria-hidden="true"
      className={`${sizeClassNames[variant]} ${className}`.trim()}
      height={PRODUCT_BRAND_LOGO_INTRINSIC_SIZE.height}
      priority={priority}
      sizes={`${dimension}px`}
      src={PRODUCT_BRAND_LOGO_PATH}
      unoptimized
      width={PRODUCT_BRAND_LOGO_INTRINSIC_SIZE.width}
    />
  );
}
