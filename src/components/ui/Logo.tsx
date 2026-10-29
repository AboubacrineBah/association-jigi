interface LogoProps {
  size?: number;
  /** Sur fond sombre, un liseré blanc entoure le badge (charte Association Jigi, section 7.1). */
  ring?: boolean;
  /** Vrai quand le nom de l'application est déjà affiché à côté du logo. */
  decorative?: boolean;
}

/** Badge Association Jigi : un « j » dont le point est un soleil levant. */
export function Logo({ size = 40, ring = false, decorative = false }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Logo Association Jigi'}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <circle cx="256" cy="256" r={ring ? 248 : 256} fill="#A8431F" stroke={ring ? '#FFFFFF' : undefined} strokeWidth={ring ? 14 : undefined} />
      <g transform="translate(27 0)">
        <circle cx="296" cy="150" r="50" fill="none" stroke="#F0B03B" strokeWidth="7" />
        <circle cx="296" cy="150" r="30" fill="#F0B03B" />
        <path d="M296 232V330A86 86 0 0 1 135.5 373" fill="none" stroke="#FFFFFF" strokeWidth="46" strokeLinecap="round" />
      </g>
    </svg>
  );
}
