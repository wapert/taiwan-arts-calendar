// Decorative classical music symbols scattered in the page background.
// Pure CSS — no images required. Opacity is very low so they don't
// distract from the calendar content.

const SYMBOLS = [
  { char: '♩', top: '8%',  left: '3%',  size: '3rem',  rotate: '-15deg', opacity: 0.07 },
  { char: '𝄞', top: '12%', left: '92%', size: '2.8rem', rotate: '10deg',  opacity: 0.07 },
  { char: '♪', top: '28%', left: '7%',  size: '2rem',  rotate: '20deg',  opacity: 0.06 },
  { char: '♫', top: '22%', left: '88%', size: '2.2rem', rotate: '-8deg',  opacity: 0.06 },
  { char: '♬', top: '50%', left: '2%',  size: '2.5rem', rotate: '12deg',  opacity: 0.05 },
  { char: '𝄢', top: '48%', left: '95%', size: '2.4rem', rotate: '-18deg', opacity: 0.05 },
  { char: '♩', top: '70%', left: '5%',  size: '1.8rem', rotate: '25deg',  opacity: 0.06 },
  { char: '♪', top: '75%', left: '91%', size: '2rem',  rotate: '-12deg', opacity: 0.06 },
  { char: '♫', top: '88%', left: '8%',  size: '2.2rem', rotate: '-20deg', opacity: 0.05 },
  { char: '♬', top: '90%', left: '88%', size: '1.9rem', rotate: '15deg',  opacity: 0.05 },
  { char: '𝄞', top: '38%', left: '50%', size: '4rem',  rotate: '5deg',   opacity: 0.03 },
];

export default function MusicBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
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
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  );
}
