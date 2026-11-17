type BrandLogoProps = {
  textClassName?: string;
  iconClassName?: string;
};

/** Shared image-and-wordmark lockup for the storefront and owner hub. */
export function BrandLogo({ textClassName = '', iconClassName = 'h-8 w-8 sm:h-10 sm:w-10' }: BrandLogoProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <img
        src="/favicon.png"
        alt=""
        aria-hidden="true"
        width={1312}
        height={1199}
        className={`shrink-0 object-contain ${iconClassName}`}
      />
      <span className={`font-display leading-none ${textClassName}`}>
        Raccoon<span className="text-red"> Hub</span>
      </span>
    </span>
  );
}
