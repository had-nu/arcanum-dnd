interface IconProps {
  className?: string;
  size?: number;
}

export function TheaterIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a10 10 0 1 0 10 10h-4a6 6 0 0 1-6-6V2Z" />
      <path d="M12 2v8a4 4 0 0 0 4 4h8" />
      <line x1="8" y1="12" x2="8" y2="12.01" />
      <line x1="16" y1="12" x2="16" y2="12.01" />
    </svg>
  );
}
