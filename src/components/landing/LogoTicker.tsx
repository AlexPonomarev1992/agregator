export function LogoTicker() {
  const aiModels = [
    'Midjourney', 'Kling', 'Flux', 'Stable Diffusion',
    'Sora', 'DALL·E 3', 'Claude', 'GPT-4o',
    'Gemini', 'Nano Banana', 'Seedream', 'Veo',
    'Runway', 'ElevenLabs', 'Midjourney', 'Kling',
  ]

  const socialNets = [
    'Instagram', 'YouTube', 'ВКонтакте', 'Telegram',
    'TikTok', 'X (Twitter)', 'LinkedIn', 'Pinterest',
    'Threads', 'Facebook', 'Instagram', 'YouTube',
    'ВКонтакте', 'Telegram', 'TikTok', 'X (Twitter)',
  ]

  return (
    <section className="overflow-hidden border-y border-white/5 bg-black py-8">
      {/* Row 1 — AI models, moving left */}
      <div className="relative mb-4 flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="animate-ticker-left flex shrink-0 gap-6 pr-6">
          {aiModels.map((name, i) => (
            <TickerChip key={`a-${i}`} label={name} />
          ))}
        </div>
        <div className="animate-ticker-left flex shrink-0 gap-6 pr-6" aria-hidden>
          {aiModels.map((name, i) => (
            <TickerChip key={`a2-${i}`} label={name} />
          ))}
        </div>
      </div>

      {/* Row 2 — Social networks, moving right */}
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="animate-ticker-right flex shrink-0 gap-6 pr-6">
          {socialNets.map((name, i) => (
            <TickerChip key={`b-${i}`} label={name} dim />
          ))}
        </div>
        <div className="animate-ticker-right flex shrink-0 gap-6 pr-6" aria-hidden>
          {socialNets.map((name, i) => (
            <TickerChip key={`b2-${i}`} label={name} dim />
          ))}
        </div>
      </div>
    </section>
  )
}

function TickerChip({ label, dim = false }: { label: string; dim?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap ${
        dim
          ? 'border-white/5 text-white/25'
          : 'border-white/10 text-white/50'
      }`}
    >
      {label}
    </span>
  )
}
