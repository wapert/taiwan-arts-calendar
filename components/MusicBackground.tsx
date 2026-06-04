'use client';
// Classical music background — violin (left) + piano (right).
// Images use position:fixed behind all content.
// Cards above use semi-transparent backgrounds so images show through.

export default function MusicBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
    >
      {/* Violin — left 40%, fades right */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '42%',
          height: '100%',
          backgroundImage: 'url(/images/violin.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          maskImage: 'linear-gradient(to right, black 0%, black 45%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, black 45%, transparent 100%)',
          opacity: 0.45,
        }}
      />

      {/* Piano — right 40%, fades left */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '42%',
          height: '100%',
          backgroundImage: 'url(/images/piano.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center left',
          maskImage: 'linear-gradient(to left, black 0%, black 45%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 0%, black 45%, transparent 100%)',
          opacity: 0.45,
        }}
      />

      {/* Music note symbols */}
      {[
        { char: '♩', top: '8%',  left: '3%',  size: '2.4rem', rotate: '-15deg', opacity: 0.35 },
        { char: '♫', top: '40%', left: '5%',  size: '2rem',   rotate: '12deg',  opacity: 0.30 },
        { char: '♬', top: '75%', left: '3%',  size: '2.2rem', rotate: '-8deg',  opacity: 0.32 },
        { char: '♪', top: '10%', left: '88%', size: '2.2rem', rotate: '10deg',  opacity: 0.35 },
        { char: '♩', top: '52%', left: '90%', size: '2rem',   rotate: '-18deg', opacity: 0.30 },
        { char: '♫', top: '80%', left: '88%', size: '2.4rem', rotate: '20deg',  opacity: 0.32 },
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
            color: '#fff',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
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
