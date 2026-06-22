interface SessionProgressProps {
  total: number;
  used: number;
  frozen: number;
  remaining: number;
}

export default function SessionProgress({ total, used, frozen, remaining }: SessionProgressProps) {
  const usedPercent = total > 0 ? (used / total) * 100 : 0;
  const frozenPercent = total > 0 ? (frozen / total) * 100 : 0;
  const remainingPercent = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div className="flex h-full">
          <div
            className="bg-coral h-full transition-all duration-500"
            style={{ width: `${usedPercent}%` }}
          />
          <div
            className="bg-sky-400 h-full transition-all duration-500"
            style={{ width: `${frozenPercent}%` }}
          />
          <div
            className="bg-emerald h-full transition-all duration-500"
            style={{ width: `${remainingPercent}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-softPink/60 whitespace-nowrap">
        剩余 <span className="text-emerald font-semibold">{remaining}</span> 次 / 总 {total} 次
      </span>
    </div>
  );
}
