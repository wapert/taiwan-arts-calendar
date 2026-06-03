import { CATEGORY_CONFIG } from '@/lib/eventTypes';

export default function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs px-4 py-2 border-b"
      style={{ background: 'var(--bg-legend)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
      {Object.values(CATEGORY_CONFIG).map((cfg) => (
        <span key={cfg.label} className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: cfg.color }}
          />
          {cfg.labelZh}
        </span>
      ))}
    </div>
  );
}
