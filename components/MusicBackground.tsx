'use client';

const NOTES = [
  // Left side — over violin
  { char: '♩', top:  '5%', left:  '2%',  size: '3.2rem', rotate: '-15deg', opacity: 0.55 },
  { char: '♫', top: '18%', left:  '6%',  size: '2.8rem', rotate:  '12deg', opacity: 0.50 },
  { char: '♬', top: '33%', left:  '2%',  size: '3.5rem', rotate:  '-8deg', opacity: 0.52 },
  { char: '♪', top: '50%', left:  '7%',  size: '2.4rem', rotate:  '20deg', opacity: 0.48 },
  { char: '♩', top: '65%', left:  '3%',  size: '3rem',   rotate: '-20deg', opacity: 0.50 },
  { char: '♫', top: '80%', left:  '5%',  size: '2.6rem', rotate:  '15deg', opacity: 0.48 },
  { char: '♬', top: '92%', left:  '2%',  size: '2.8rem', rotate: '-10deg', opacity: 0.45 },

  // Right side — over piano
  { char: '♪', top:  '7%', left: '89%',  size: '3.2rem', rotate:  '10deg', opacity: 0.55 },
  { char: '♩', top: '20%', left: '85%',  size: '3rem',   rotate: '-18deg', opacity: 0.50 },
  { char: '♫', top: '36%', left: '90%',  size: '2.8rem', rotate:  '22deg', opacity: 0.52 },
  { char: '♬', top: '52%', left: '86%',  size: '3.4rem', rotate:  '-8deg', opacity: 0.48 },
  { char: '♪', top: '67%', left: '91%',  size: '2.6rem', rotate:  '14deg', opacity: 0.50 },
  { char: '♩', top: '82%', left: '87%',  size: '3rem',   rotate: '-22deg', opacity: 0.48 },
  { char: '♫', top: '94%', left: '90%',  size: '2.4rem', rotate:  '10deg', opacity: 0.45 },

  // Centre — large, very subtle
  { char: '♬', top: '25%', left: '44%',  size: '5rem',   rotate:   '5deg', opacity: 0.12 },
  { char: '♪', top: '60%', left: '48%',  size: '4rem',   rotate: '-10deg', opacity: 0.10 },
  { char: '♩', top: '80%', left: '42%',  size: '3.5rem', rotate:   '8deg', opacity: 0.10 },
];

export default function MusicBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
    >
      {/* Violin — left side */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '42%', height: '100%',
        backgroundImage: 'url(/images/violin.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center right',
        maskImage: 'linear-gradient(to right, black 0%, black 45%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, black 0%, black 45%, transparent 100%)',
        opacity: 0.45,
      }} />

      {/* Piano — right side */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '42%', height: '100%',
        backgroundImage: 'url(/images/piano.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center left',
        maskImage: 'linear-gradient(to left, black 0%, black 45%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to left, black 0%, black 45%, transparent 100%)',
        opacity: 0.45,
      }} />

      {/* Music notes */}
      {NOTES.map((s, i) => (
        <span key={i} style={{
          position: 'absolute',
          top: s.top, left: s.left,
          fontSize: s.size,
          transform: `rotate(${s.rotate})`,
          opacity: s.opacity,
          color: 'var(--color-note)',
          textShadow: '0 2px 6px rgba(0,0,0,0.4)',
          lineHeight: 1,
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}>
          {s.char}
        </span>
      ))}
    </div>
  );
}
