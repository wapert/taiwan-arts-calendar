'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventContentArg } from '@fullcalendar/core';
import { ArtEvent, CATEGORY_CONFIG } from '@/lib/eventTypes';
import { useRef, useEffect } from 'react';

/** Convert #rrggbb → rgba(r,g,b,alpha) */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const NORMAL_FILL   = 0.35;
const NORMAL_BORDER = 0.70;
const ACTIVE_FILL   = 0.92;
const ACTIVE_BORDER = 1.00;

// Store DOM element + original colors so we can reset
interface ActiveRef {
  el: HTMLElement;
  normalBg: string;
  normalBorder: string;
}

interface Props {
  events: ArtEvent[];
  onEventClick: (event: ArtEvent) => void;
  selectedEventId: string | null;
}

export default function CalendarView({ events, onEventClick, selectedEventId }: Props) {
  const calendarRef = useRef<FullCalendar>(null);
  const activeRef   = useRef<ActiveRef | null>(null);

  // Reload all events when filter changes
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    activeRef.current = null;
    api.removeAllEvents();
    api.addEventSource(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor: withAlpha(CATEGORY_CONFIG[e.category].color, NORMAL_FILL),
        borderColor:     withAlpha(CATEGORY_CONFIG[e.category].color, NORMAL_BORDER),
        textColor:       CATEGORY_CONFIG[e.category].textColor,
        extendedProps: e,
      }))
    );
  }, [events]);

  // Reset DOM style when modal closes (selectedEventId → null)
  useEffect(() => {
    if (selectedEventId !== null) return;
    const prev = activeRef.current;
    if (!prev) return;
    prev.el.style.backgroundColor = prev.normalBg;
    prev.el.style.borderColor     = prev.normalBorder;
    activeRef.current = null;
  }, [selectedEventId]);

  const handleClick = (arg: EventClickArg) => {
    const artEvent = arg.event.extendedProps as ArtEvent;
    const color    = CATEGORY_CONFIG[artEvent.category]?.color ?? '#888';
    const normalBg     = withAlpha(color, NORMAL_FILL);
    const normalBorder = withAlpha(color, NORMAL_BORDER);

    // Reset previous element
    const prev = activeRef.current;
    if (prev && prev.el !== arg.el) {
      prev.el.style.backgroundColor = prev.normalBg;
      prev.el.style.borderColor     = prev.normalBorder;
    }

    // Highlight clicked element directly via DOM
    arg.el.style.backgroundColor = withAlpha(color, ACTIVE_FILL);
    arg.el.style.borderColor     = color;
    activeRef.current = { el: arg.el, normalBg, normalBorder };

    onEventClick(artEvent);
  };

  const renderContent = (arg: EventContentArg) => (
    <div className="text-xs px-1 truncate">{arg.event.title}</div>
  );

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,listMonth',
      }}
      locale="zh-tw"
      firstDay={0}
      buttonText={{ today: '今天', month: '月曆', list: '清單' }}
      titleFormat={{ year: 'numeric', month: 'long' }}
      events={[]}
      eventClick={handleClick}
      eventContent={renderContent}
      height="auto"
      dayMaxEvents={4}
      fixedWeekCount={false}
      dayCellContent={(args) => args.dayNumberText.replace('日', '')}
      dayHeaderClassNames="fc-custom-day-header"
      dayHeaderContent={(args) => (
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.03em' }}>
          {args.text}
        </span>
      )}
    />
  );
}
