'use client';

import { ArtEvent, CATEGORY_CONFIG } from '@/lib/eventTypes';

interface Props {
  event: ArtEvent | null;
  onClose: () => void;
}

/** Format YYYY-MM-DD → YYYYMMDD for ICS */
function icsDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/** Add one day to YYYY-MM-DD (ICS DTEND for all-day is exclusive) */
function nextDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/** Escape special ICS characters */
function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function generateICS(event: ArtEvent): string {
  const dtstart = icsDate(event.start);
  const dtend   = nextDay(event.end ?? event.start);
  const uid     = `${event.id}@taiwan-arts-calendar.vercel.app`;
  const now     = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//台灣藝文月曆//Taiwan Arts Calendar//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `LOCATION:${icsEscape(event.venue)}`,
    event.url ? `URL:${event.url}` : '',
    event.description ? `DESCRIPTION:${icsEscape(event.description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return lines;
}

function downloadICS(event: ArtEvent) {
  const content  = generateICS(event);
  const blob     = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url      = URL.createObjectURL(blob);
  const filename = event.title.slice(0, 30).replace(/[^\w一-鿿]/g, '_') + '.ics';

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

          {/* Action buttons */}
          <div className="mt-5 flex flex-col gap-2">
            {/* Add to Calendar */}
            <button
              onClick={() => downloadICS(event)}
              className="w-full text-center py-2 rounded-lg font-medium text-sm border transition-colors"
              style={{
                borderColor: cfg.color,
                color: cfg.color,
                background: 'transparent',
              }}
            >
              📅 加入行事曆
            </button>

            {/* View / Buy ticket */}
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2 rounded-lg text-white font-medium text-sm"
                style={{ backgroundColor: cfg.color }}
              >
                查看詳情 / 購票 →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
