export interface DashboardBrandWordmarkProps {
  readonly accentLine: string;
  readonly primaryLine: string;
}

export function DashboardBrandWordmark({
  accentLine,
  primaryLine,
}: DashboardBrandWordmarkProps) {
  return (
    <>
      <span className="block text-[1.05rem] leading-[0.92] font-extrabold tracking-[-0.02em] text-[#1A237E] sm:text-[1.2rem] lg:text-[1.35rem] dark:text-[#E8EEF9]">
        {primaryLine}
      </span>
      <span
        className="block bg-[linear-gradient(90deg,#087CFF_0%,#6B5CFF_34%,#E91E63_68%,#FF5722_100%)] bg-clip-text text-[1.05rem] leading-[0.92] font-extrabold tracking-[-0.02em] text-transparent sm:text-[1.2rem] lg:text-[1.35rem]"
        style={{
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {accentLine}
      </span>
    </>
  );
}
