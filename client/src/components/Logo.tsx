const Logo = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#logoGradient)" opacity="0.15" />
      <path
        d="M22 34L30 20L28 28H38L26 44L38 30H30L32 22L22 34Z"
        fill="#EDE9FE"
      />
      <path
        d="M32 20L36 12L42 24H34L40 36L28 26H36L32 20Z"
        fill="#A78BFA"
      />
    </svg>
  </div>
);

export default Logo;
