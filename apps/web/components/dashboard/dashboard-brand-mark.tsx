export function DashboardBrandMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_24px_rgba(37,99,235,0.18)] sm:size-12"
    >
      <svg viewBox="0 0 64 64" className="size-full" focusable="false">
        <defs>
          <linearGradient id="dashboard-drop" x1="18" y1="10" x2="46" y2="52">
            <stop offset="0" stopColor="#12DDF0" />
            <stop offset="0.48" stopColor="#087CFF" />
            <stop offset="1" stopColor="#E600D7" />
          </linearGradient>
          <linearGradient id="dashboard-orbit" x1="8" y1="20" x2="56" y2="45">
            <stop offset="0" stopColor="#F02BD5" />
            <stop offset="0.5" stopColor="#20D9F2" />
            <stop offset="1" stopColor="#376CFF" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="17" fill="#fff" />
        <path
          d="M32 9C26 18 20 25 20 34a12 12 0 0 0 24 0c0-9-6-16-12-25Z"
          fill="url(#dashboard-drop)"
        />
        <path
          d="M25 31c2-5 5-9 8-13"
          fill="none"
          stroke="#BFFBFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity=".9"
        />
        <ellipse
          cx="32"
          cy="34"
          rx="25"
          ry="8.5"
          fill="none"
          stroke="url(#dashboard-orbit)"
          strokeWidth="2.2"
          transform="rotate(12 32 34)"
        />
        <circle cx="9" cy="31" r="2.5" fill="#168CFF" />
        <circle cx="54" cy="39" r="2.5" fill="#FF3D86" />
        <path
          d="m48 12 1.2 3.2L52 16.5l-2.8 1.2L48 21l-1.2-3.3-2.8-1.2 2.8-1.3L48 12Z"
          fill="#18BDEB"
        />
      </svg>
    </span>
  );
}
