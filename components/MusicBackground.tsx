'use client';
// Classical music background — violin (left) + piano (right).
// To use your own images: drop files into public/images/violin.jpg
// and public/images/piano.jpg and they'll replace these automatically.

export default function MusicBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
    >
      {/* Violin — left side, fades to transparent toward center */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '28%',
          height: '100%',
          backgroundImage: 'url(/images/violin.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
          maskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
        }}
      />

      {/* Piano — right side, fades to transparent toward center */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '28%',
          height: '100%',
          backgroundImage: 'url(/images/piano.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
          maskImage: 'linear-gradient(to left, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 100%)',
        }}
      />

      {/* Subtle music note symbols over the images */}
      {[
        { char: '♩', top: '8%',  left: '4%',  size: '2.5rem', rotate: '-15deg', opacity: 0.15 },
        { char: '♫', top: '35%', left: '6%',  size: '2rem',   rotate: '12deg',  opacity: 0.12 },
        { char: '♬', top: '70%', left: '3%',  size: '2.2rem', rotate: '-8deg',  opacity: 0.13 },
        { char: '♪', top: '12%', left: '88%', size: '2.2rem', rotate: '10deg',  opacity: 0.15 },
        { char: '♩', top: '50%', left: '91%', size: '2rem',   rotate: '-18deg', opacity: 0.12 },
        { char: '♫', top: '82%', left: '89%', size: '2.4rem', rotate: '20deg',  opacity: 0.13 },
      ].map((s, i) => (
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
