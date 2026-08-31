const PALETTE = ['#d1a954', '#4fd18b', '#5b9de8', '#ef6f6f', '#c58ee0', '#e89b4f', '#5fd1c9', '#e0668f'];

function hashName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PlayerAvatar({ name, size = 36 }) {
  const color = PALETTE[hashName(name) % PALETTE.length];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${color}26`,
        border: `1.5px solid ${color}`,
        color,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </span>
  );
}
