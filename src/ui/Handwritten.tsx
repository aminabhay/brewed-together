/** Text that writes itself stroke by stroke (SVG stroke-dashoffset), word by word. */
export function Handwritten({ text, className = '', size = 88, active = true, color = '#FFF8EE', delay = 0 }: { text: string; className?: string; size?: number; active?: boolean; color?: string; delay?: number }) {
  const words = text.split(' ')
  const width = Math.max(300, text.length * size * 0.42)
  return (
    <svg className={`${className} ${active ? 'is-writing' : ''}`} viewBox={`0 0 ${width} ${size * 1.35}`} role="img" aria-label={text} style={{ maxWidth: '100%', height: 'auto', overflow: 'visible' }}>
      <text x="50%" y={size} textAnchor="middle" fontFamily="Caveat, cursive" fontWeight={700} fontSize={size} fill={color} stroke={color} strokeWidth={1.2}>
        {words.map((w, i) => (
          <tspan key={i} className="hw-word" style={{ animationDelay: `${delay + i * 0.35}s` }}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </tspan>
        ))}
      </text>
    </svg>
  )
}
