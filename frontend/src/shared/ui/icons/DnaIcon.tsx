interface IconProps {
  className?: string;
  size?: number;
}

export function DnaIcon({ className = '', size = 24 }: IconProps) {
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
      <path d="M12 2c4.8 0 8 2.5 8 5.5S16.8 13 12 13s-8-2.5-8-5.5S7.2 2 12 2Z" />
      <path d="M12 11c4.8 0 8 2.5 8 5.5S16.8 22 12 22s-8-2.5-8-5.5S7.2 11 12 11Z" />
      <line x1="4" y1="8" x2="8" y2="8" />
      <line x1="16" y1="8" x2="20" y2="8" />
      <line x1="8" y1="16" x2="12" y2="16" />
      <line x1="16" y1="16" x2="20" y2="16" />
    </svg>
  );
}
