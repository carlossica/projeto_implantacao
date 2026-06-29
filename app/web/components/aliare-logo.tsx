/**
 * Logo Aliare — versão SVG inline (sem asset externo).
 * Reproduz o lockup: "aliare" + quadrado ciano acima e quadrado verde abaixo do "i".
 */
export function AliareLogo({
  className,
  variant = "dark",
}: {
  className?: string;
  /** "dark" = texto preto (sobre fundo claro). "light" = branco. */
  variant?: "dark" | "light";
}) {
  const textFill = variant === "light" ? "#ffffff" : "#0a0a0a";
  return (
    <svg
      viewBox="0 0 170 70"
      role="img"
      aria-label="Aliare"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="58" y="2" width="11" height="11" fill="#00BCD8" />
      <text
        x="0"
        y="50"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight={900}
        fontSize={50}
        fill={textFill}
        letterSpacing="-0.02em"
      >
        aliare
      </text>
      <rect x="58" y="56" width="11" height="11" fill="#3CC72D" />
    </svg>
  );
}
