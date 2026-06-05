'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventApi, EventClickArg, EventContentArg } from '@fullcalendar/core';
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
const ACTIVE_FILL   = 0.88;  // nearly opaque when tapped
const ACTIVE_BORDER = 1.00;

interface Props {
  events: ArtEvent[];
  onEventClick: (event: ArtEvent) => void;
  selectedEventId: string | null;  // null = modal closed → reset highlight
}

export default function CalendarView({ events, onEventClick, selectedEventId }: Props) {
  const calendarRef  = useRef<FullCalendar>(null);
  const selectedRef  = useRef<EventApi | null>(null);  // currently highlighted FC event

  // Reload all events when filter changes
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    selectedRef.current = null;
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

  // Reset highlight when modal is closed (selectedEventId becomes null)
  useEffect(() => {
    if (selectedEventId !== null) return;
    const prev = selectedRef.current;
    if (!prev) return;
    const artEvent = prev.extendedProps as ArtEvent;
    const color = CATEGORY_CONFIG[artEvent.category].color;
    prev.setProp('backgroundColor', withAlpha(color, NORMAL_FILL));
    prev.setProp('borderColor',     withAlpha(color, NORMAL_BORDER));
    selectedRef.current = null;
  }, [selectedEventId]);

  const handleClick = (arg: EventClickArg) => {
    const artEvent = arg.event.extendedProps as ArtEvent;
    const color    = CATEGORY_CONFIG[artEvent.category].color;

    // Reset previous selection
    if (selectedRef.current && selectedRef.current.id !== arg.event.id) {
      const prev = selectedRef.current.extendedProps as ArtEvent;
      const prevColor = CATEGORY_CONFIG[prev.category].color;
      selectedRef.current.setProp('backgroundColor', withAlpha(prevColor, NORMAL_FILL));
      selectedRef.current.setProp('borderColor',     withAlpha(prevColor, NORMAL_BORDER));
    }

    // Highlight tapped event
    arg.event.setProp('backgroundColor', withAlpha(color, ACTIVE_FILL));
    arg.event.setProp('borderColor',     color);
    selectedRef.current = arg.event;

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
