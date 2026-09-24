export default function MusicEqualizer() {
  return (
    <svg className="music-equalizer" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      {[0, 4, 8, 12, 16].map((x) => (
        <rect key={x} className="music-equalizer__bar" x={x} y="1" width="2" height="16" />
      ))}
    </svg>
  );
}
