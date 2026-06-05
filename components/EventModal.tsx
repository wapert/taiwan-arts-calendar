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

/** Build Google Calendar add-event URL */
function googleCalendarUrl(event: ArtEvent): string {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const dates = `${icsDate(event.start)}/${nextDay(event.end ?? event.start)}`;
  const params = new URLSearchParams({
    text:     event.title,
    dates,
    location: event.venue,
    details:  [event.description, event.url].filter(Boolean).join('\n'),
  });
  return `${base}&${params.toString()}`;
}

/** Build Apple Calendar URL — uses webcal: data URI on iOS, falls back to .ics download */
function appleCalendarUrl(event: ArtEvent): string {
  // On iOS/macOS Safari, a data: URI with text/calendar opens Apple Calendar directly
  const ics = generateICS(event);
  const encoded = encodeURIComponent(ics);
  return `data:text/calendar;charset=utf-8,${encoded}`;
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
        style={{ background: 'var(--bg-modal)' }}
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

          {/* Calendar buttons */}
          <div className="mt-5 flex flex-col gap-2">

            {/* Google Calendar */}
            <a
              href={googleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm border transition-colors"
              style={{ borderColor: '#4285F4', color: '#4285F4', background: 'transparent' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#4285F4">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
              加入 Google 日曆
            </a>

            {/* Apple Calendar */}
            <a
              href={appleCalendarUrl(event)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm border transition-colors"
              style={{ borderColor: '#555', color: '#555', background: 'transparent' }}
              download={event.title.slice(0, 30).replace(/[^\w一-鿿]/g, '_') + '.ics'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              加入 Apple 日曆
            </a>

            {/* Other / .ics download */}
            <button
              onClick={() => downloadICS(event)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
            >
              📥 下載 .ics（Outlook 等）
            </button>

            {/* View / Buy ticket */}
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2 rounded-lg text-white font-medium text-sm mt-1"
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
