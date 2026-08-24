export function DashboardBrandMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[0.95rem] bg-white shadow-[0_8px_22px_rgba(67,97,238,0.18)] sm:size-12 sm:rounded-2xl"
    >
      <svg viewBox="0 0 64 64" className="size-full" focusable="false">
        <defs>
          <linearGradient id="dashboard-drop" x1="18" y1="10" x2="46" y2="52">
            <stop offset="0" stopColor="#00D8FF" />
            <stop offset="0.45" stopColor="#087CFF" />
            <stop offset="1" stopColor="#E600D7" />
          </linearGradient>
          <linearGradient id="dashboard-orbit-a" x1="8" y1="20" x2="56" y2="45">
            <stop offset="0" stopColor="#20D9F2" />
            <stop offset="0.55" stopColor="#376CFF" />
            <stop offset="1" stopColor="#F02BD5" />
          </linearGradient>
          <linearGradient id="dashboard-orbit-b" x1="56" y1="18" x2="8" y2="46">
            <stop offset="0" stopColor="#FF3D86" />
            <stop offset="0.5" stopColor="#F02BD5" />
            <stop offset="1" stopColor="#FF5722" />
          </linearGradient>
          <radialGradient id="dashboard-drop-glow" cx="32" cy="44" r="18">
            <stop offset="0" stopColor="#FF3D86" stopOpacity="0.28" />
            <stop offset="1" stopColor="#FF3D86" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="#fff" />
        <ellipse
          cx="32"
          cy="44"
          fill="url(#dashboard-drop-glow)"
          rx="22"
          ry="10"
        />
        <path
          d="M32 9C26 18 20 25 20 34a12 12 0 0 0 24 0c0-9-6-16-12-25Z"
          fill="url(#dashboard-drop)"
        />
        <path
          d="M24 18C27 14 29 12 32 11C30 16 27 21 25 27"
          fill="#FFFFFF"
          opacity="0.42"
        />
        <path
          d="M25 31c2-5 5-9 8-13"
          fill="none"
          opacity="0.92"
          stroke="#BFFBFF"
          strokeLinecap="round"
          strokeWidth="2.4"
        />
        <ellipse
          cx="32"
          cy="34"
          fill="none"
          rx="25"
          ry="8.5"
          stroke="url(#dashboard-orbit-a)"
          strokeWidth="2.1"
          transform="rotate(12 32 34)"
        />
        <ellipse
          cx="32"
          cy="34"
          fill="none"
          rx="23"
          ry="7.8"
          stroke="url(#dashboard-orbit-b)"
          strokeWidth="1.8"
          transform="rotate(-28 32 34)"
        />
        <circle cx="9" cy="31" fill="#168CFF" r="2.5" />
        <circle cx="54" cy="39" fill="#FF5722" r="2.5" />
        <circle cx="14" cy="18" fill="#18D9F2" r="0.9" />
        <circle cx="49" cy="16" fill="#7A5CFF" r="0.7" />
        <path
          d="m48 12 1.2 3.2L52 16.5l-2.8 1.2L48 21l-1.2-3.3-2.8-1.2 2.8-1.3L48 12Z"
          fill="#18BDEB"
        />
        <path
          d="m18 24 0.8 2.1 2.1 0.9-2.1 0.9-0.8 2.1-0.8-2.1-2.1-0.9 2.1-0.9L18 24Z"
          fill="#20D9F2"
        />
      </svg>
    </span>
  );
}
