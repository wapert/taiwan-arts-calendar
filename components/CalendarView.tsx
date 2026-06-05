'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventContentArg, EventMountArg } from '@fullcalendar/core';
import { ArtEvent, CATEGORY_CONFIG } from '@/lib/eventTypes';
import { useRef, useEffect, useCallback } from 'react';

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface Props {
  events: ArtEvent[];
  onEventClick: (event: ArtEvent) => void;
  selectedEventId: string | null;
}

export default function CalendarView({ events, onEventClick, selectedEventId }: Props) {
  const calendarRef = useRef<FullCalendar>(null);

  // Reload events only when filter changes
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.removeAllEvents();
    api.addEventSource(
      events.map((e) => {
        const color = CATEGORY_CONFIG[e.category].color;
        return {
          id:              e.id,
          title:           e.title,
          start:           e.start,
          end:             e.end,
          backgroundColor: withAlpha(color, 0.35),
          borderColor:     withAlpha(color, 0.70),
          textColor:       CATEGORY_CONFIG[e.category].textColor,
          extendedProps:   e,
        };
      })
    );
  }, [events]);

  // Store the event's category color as a CSS variable on its DOM element
  // so the .fc-event-active CSS rule can use it for full-opacity background
  const handleEventDidMount = useCallback((info: EventMountArg) => {
    const e = info.event.extendedProps as ArtEvent;
    const color = CATEGORY_CONFIG[e.category]?.color ?? '#888';
    info.el.style.setProperty('--event-color', color);
  }, []);

  // Returns 'fc-event-active' for the selected event — FullCalendar
  // re-evaluates eventClassNames on every render, so this is reactive
  const getEventClassNames = useCallback(
    (arg: { event: { id: string } }) =>
      arg.event.id === selectedEventId ? ['fc-event-active'] : [],
    [selectedEventId]
  );

  const handleClick = (arg: EventClickArg) => {
    onEventClick(arg.event.extendedProps as ArtEvent);
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
      eventClassNames={getEventClassNames}
      eventDidMount={handleEventDidMount}
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
