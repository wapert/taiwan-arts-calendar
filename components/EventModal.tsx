'use client';

import { ArtEvent, CATEGORY_CONFIG } from '@/lib/eventTypes';

interface Props {
  event: ArtEvent | null;
  onClose: () => void;
}

export default function EventModal({ event, onClose }: Props) {
  if (!event) return null;

  const cfg = CATEGORY_CONFIG[event.category];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ background: 'var(--bg-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-2" style={{ backgroundColor: cfg.color }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {event.title}
            </h2>
            <button
              onClick={onClose}
              className="text-2xl leading-none flex-shrink-0 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              ×
            </button>
          </div>

          <span
            className="inline-block text-xs font-medium px-2 py-1 rounded-full mb-4"
            style={{ backgroundColor: cfg.color, color: cfg.textColor }}
          >
            {cfg.labelZh}
          </span>

          <dl className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex gap-2">
              <dt className="font-semibold w-14 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>場館</dt>
              <dd>{event.venue}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold w-14 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>城市</dt>
              <dd>{event.city}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold w-14 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>日期</dt>
              <dd>
                {event.start}
                {event.end && event.end !== event.start ? ` → ${event.end}` : ''}
              </dd>
            </div>
            {event.description && (
              <div className="flex gap-2">
                <dt className="font-semibold w-14 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>簡介</dt>
                <dd>{event.description}</dd>
              </div>
            )}
          </dl>

          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block w-full text-center py-2 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: cfg.color }}
            >
              查看詳情 / 購票 →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
