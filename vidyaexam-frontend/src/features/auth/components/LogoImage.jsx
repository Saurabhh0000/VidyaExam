import { useState } from "react";

// Uses whichever logo exists in /public. Falls back from PNG to SVG once.
const LOGO_SOURCES = ["/logo.png", "/logo.svg"];

export default function LogoImage({ className = "" }) {
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={LOGO_SOURCES[idx]}
      alt="VidyaExam"
      className={className}
      onError={() => setIdx((i) => (i < LOGO_SOURCES.length - 1 ? i + 1 : i))}
    />
  );
}
