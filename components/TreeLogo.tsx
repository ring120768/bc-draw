/**
 * The Breakfast Club logo — fried egg on the green with a dimpled
 * golf-ball yolk and pin flag. Drawn as an SVG so it scales cleanly.
 * (File keeps its original name so imports don't change.)
 */
export default function TreeLogo({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="The Breakfast Club logo"
      role="img"
    >
      {/* Club-green rounded background border */}
      <rect width="512" height="512" rx="96" fill="#1a5632" />
      {/* Egg white */}
      <path
        d="M256 96 C340 88 420 140 424 216 C428 276 396 300 404 348 C410 392 372 428 316 424 C272 421 260 400 216 408 C160 418 100 384 96 320 C92 264 128 248 124 200 C120 144 180 104 256 96 Z"
        fill="#fdfaf2"
        stroke="#e8e0cf"
        strokeWidth="6"
      />
      {/* Yolk as dimpled golf ball */}
      <circle cx="256" cy="256" r="86" fill="#f5b921" />
      <g fill="#e09c0f">
        <circle cx="226" cy="226" r="9" />
        <circle cx="266" cy="218" r="9" />
        <circle cx="300" cy="240" r="9" />
        <circle cx="216" cy="266" r="9" />
        <circle cx="256" cy="258" r="9" />
        <circle cx="294" cy="280" r="9" />
        <circle cx="236" cy="302" r="9" />
        <circle cx="274" cy="316" r="9" />
      </g>
      {/* Pin flag */}
      <rect x="352" y="120" width="10" height="120" rx="4" fill="#5b4632" />
      <path d="M362 124 L428 146 L362 170 Z" fill="#c62828" />
    </svg>
  );
}
