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

interface Props {
  events: ArtEvent[];
  onEventClick: (event: ArtEvent) => void;
}

export default function CalendarView({ events, onEventClick }: Props) {
  const calendarRef = useRef<FullCalendar>(null);

  // FullCalendar list view doesn't react to the events prop changing.
  // Fix: remove all + addEventSource (one batch call, not N individual ones).
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.removeAllEvents();
    api.addEventSource(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor: withAlpha(CATEGORY_CONFIG[e.category].color, 0.55),
        borderColor:     withAlpha(CATEGORY_CONFIG[e.category].color, 0.85),
        textColor:       CATEGORY_CONFIG[e.category].textColor,
        extendedProps: e,
      }))
    );
  }, [events]);

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
      height="auto"
      dayMaxEvents={4}
      fixedWeekCount={false}
    />
  );
}
