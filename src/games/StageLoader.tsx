/** Loading state shared by every Save the Date game: a spinning marigold. */
export function StageLoader({ label = 'Getting the baraat ready…' }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#1a0d10] text-[#FFF3E6]">
      <div className="std-marigold" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} style={{ transform: `rotate(${i * 36}deg) translateY(-18px)` }} />
        ))}
      </div>
      <p className="font-serif text-lg italic opacity-80" role="status">
        {label}
      </p>
    </div>
  )
}
