// Decorative classical music symbols in the page background.
// Only uses ♩ ♪ ♫ ♬ (U+2669–266C) — universally supported in all system fonts.
// 𝄞 𝄢 are NOT used as they require rare supplementary-plane fonts.

const SYMBOLS = [
  { char: '♩', top: '6%',  left: '2%',  size: '3.5rem', rotate: '-15deg', opacity: 0.12 },
  { char: '♫', top: '10%', left: '91%', size: '3rem',   rotate: '10deg',  opacity: 0.12 },
  { char: '♪', top: '26%', left: '5%',  size: '2.5rem', rotate: '20deg',  opacity: 0.10 },
  { char: '♬', top: '20%', left: '87%', size: '2.8rem', rotate: '-8deg',  opacity: 0.10 },
  { char: '♫', top: '48%', left: '1%',  size: '3rem',   rotate: '12deg',  opacity: 0.09 },
  { char: '♩', top: '46%', left: '94%', size: '2.6rem', rotate: '-18deg', opacity: 0.09 },
  { char: '♬', top: '68%', left: '4%',  size: '2.2rem', rotate: '25deg',  opacity: 0.10 },
  { char: '♪', top: '72%', left: '90%', size: '2.4rem', rotate: '-12deg', opacity: 0.10 },
  { char: '♩', top: '87%', left: '7%',  size: '2.6rem', rotate: '-20deg', opacity: 0.09 },
  { char: '♫', top: '89%', left: '87%', size: '2.2rem', rotate: '15deg',  opacity: 0.09 },
  { char: '♬', top: '38%', left: '48%', size: '5rem',   rotate: '5deg',   opacity: 0.05 },
  { char: '♪', top: '60%', left: '45%', size: '2rem',   rotate: '-10deg', opacity: 0.06 },
];

export default function MusicBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
    >
      {SYMBOLS.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            fontSize: s.size,
            transform: `rotate(${s.rotate})`,
            opacity: s.opacity,
            color: 'var(--text-primary)',
            lineHeight: 1,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  );
}
