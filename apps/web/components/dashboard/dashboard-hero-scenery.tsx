export function DashboardHeroScenery() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(251,191,36,0.28),transparent_28%),radial-gradient(circle_at_62%_78%,rgba(244,114,182,0.18),transparent_32%),linear-gradient(165deg,rgba(125,211,252,0.92)_0%,rgba(34,211,238,0.82)_38%,rgba(20,184,166,0.88)_100%)]" />
        <div className="absolute top-[8%] right-[18%] size-24 rounded-full bg-gradient-to-br from-amber-100/70 to-orange-200/35 blur-2xl" />
        <div className="absolute top-[14%] left-[12%] size-32 rounded-full bg-white/18 blur-3xl" />
        <svg
          className="absolute inset-x-0 bottom-0 h-[68%] w-full"
          preserveAspectRatio="none"
          viewBox="0 0 480 280"
        >
          <defs>
            <linearGradient id="heroHillBack" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(52,211,153,0.28)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0.18)" />
            </linearGradient>
            <linearGradient id="heroHillMid" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(74,222,128,0.42)" />
              <stop offset="100%" stopColor="rgba(34,197,94,0.32)" />
            </linearGradient>
            <linearGradient id="heroHillFront" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(134,239,172,0.52)" />
              <stop offset="100%" stopColor="rgba(52,211,153,0.38)" />
            </linearGradient>
            <linearGradient id="heroWater" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(56,189,248,0.22)" />
              <stop offset="100%" stopColor="rgba(14,165,233,0.34)" />
            </linearGradient>
          </defs>
          <path
            d="M0 170 C70 120 150 190 240 145 C330 100 390 165 480 125 L480 280 L0 280 Z"
            fill="url(#heroHillBack)"
          />
          <path
            d="M0 198 C90 160 180 230 280 185 C360 150 410 210 480 178 L480 280 L0 280 Z"
            fill="url(#heroHillMid)"
          />
          <path
            d="M250 118 C300 88 360 108 480 82 L480 205 C410 220 340 198 250 215 Z"
            fill="url(#heroWater)"
          />
          <path
            d="M0 220 C100 195 190 250 300 215 C360 195 420 235 480 210 L480 280 L0 280 Z"
            fill="url(#heroHillFront)"
          />
          <path
            d="M36 228 C42 206 48 198 54 220 C58 236 52 244 44 238 Z"
            fill="rgba(22,163,74,0.42)"
          />
          <path
            d="M72 232 C78 210 86 204 92 226 C96 242 88 248 80 242 Z"
            fill="rgba(34,197,94,0.38)"
          />
          <path
            d="M404 214 C410 192 418 186 424 208 C428 224 420 230 412 224 Z"
            fill="rgba(16,185,129,0.36)"
          />
          <path
            d="M430 220 C436 198 444 192 450 214 C454 230 446 236 438 230 Z"
            fill="rgba(52,211,153,0.34)"
          />
        </svg>
        <svg
          aria-hidden="true"
          className="absolute bottom-[18%] left-[8%] h-16 w-12 opacity-45"
          viewBox="0 0 48 64"
        >
          <path
            d="M24 58 C18 42 10 28 14 16 C18 6 24 10 24 22 C24 10 30 6 34 16 C38 28 30 42 24 58 Z"
            fill="rgba(255,255,255,0.35)"
          />
        </svg>
        <svg
          aria-hidden="true"
          className="absolute right-[10%] bottom-[22%] h-14 w-10 opacity-35"
          viewBox="0 0 40 56"
        >
          <path
            d="M20 50 C14 36 8 24 12 14 C16 6 20 10 20 18 C20 10 24 6 28 14 C32 24 26 36 20 50 Z"
            fill="rgba(167,139,250,0.32)"
          />
        </svg>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-4 -right-1 grid size-[clamp(7.5rem,30vw,11.5rem)] place-items-center sm:top-6 sm:right-1"
      >
        <span className="absolute size-full rounded-full bg-gradient-to-br from-white/20 via-cyan-100/15 to-violet-200/20 blur-md" />
        <span className="absolute size-[94%] rounded-full border border-white/25 bg-white/8" />
        <span className="absolute size-[80%] rounded-full border border-white/18 bg-white/5" />
        <span className="absolute size-[66%] rounded-full border border-white/12" />
        <span className="relative grid size-[54%] place-items-center rounded-full bg-gradient-to-br from-white via-cyan-50 to-teal-100 shadow-[0_22px_60px_rgba(8,145,178,0.38)]">
          <svg
            aria-hidden="true"
            className="size-[58%] text-cyan-500 drop-shadow-[0_4px_14px_rgba(6,182,212,0.45)]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 2.8c-3.8 4.6-6 8.4-6 11.8a6 6 0 1 0 12 0c0-3.4-2.2-7.2-6-11.8Z"
              fill="currentColor"
            />
          </svg>
        </span>
      </div>
    </>
  );
}
