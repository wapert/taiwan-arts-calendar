'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventContentArg } from '@fullcalendar/core';
import { ArtEvent, CATEGORY_CONFIG } from '@/lib/eventTypes';
import { useRef, useEffect } from 'react';

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const NORMAL_FILL   = 0.35;
const NORMAL_BORDER = 0.70;

interface Props {
  events: ArtEvent[];
  onEventClick: (event: ArtEvent) => void;
  selectedEventId: string | null;
}

export default function CalendarView({ events, onEventClick, selectedEventId }: Props) {
  const calendarRef = useRef<FullCalendar>(null);

  // Re-run whenever events OR selectedEventId changes.
  // The selected event gets full opacity baked directly into the event data,
  // so FullCalendar's own rendering always shows the right color — no setProp race.
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.removeAllEvents();
    api.addEventSource(
      events.map((e) => {
        const color    = CATEGORY_CONFIG[e.category].color;
        const isActive = e.id === selectedEventId;
        return {
          id:    e.id,
          title: e.title,
          start: e.start,
          end:   e.end,
          backgroundColor: isActive ? color : withAlpha(color, NORMAL_FILL),
          borderColor:     isActive ? color : withAlpha(color, NORMAL_BORDER),
          textColor:       CATEGORY_CONFIG[e.category].textColor,
          extendedProps:   e,
        };
      })
    );
  }, [events, selectedEventId]);

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
