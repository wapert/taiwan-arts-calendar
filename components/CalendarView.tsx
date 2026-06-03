'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventContentArg } from '@fullcalendar/core';
import { ArtEvent, CATEGORY_CONFIG } from '@/lib/eventTypes';
import { useMemo } from 'react';

interface Props {
  events: ArtEvent[];
  onEventClick: (event: ArtEvent) => void;
}

export default function CalendarView({ events, onEventClick }: Props) {
  const fcEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor: CATEGORY_CONFIG[e.category].color,
        borderColor: CATEGORY_CONFIG[e.category].color,
        textColor: CATEGORY_CONFIG[e.category].textColor,
        extendedProps: e,
      })),
    [events]
  );

  const handleClick = (arg: EventClickArg) => {
    onEventClick(arg.event.extendedProps as ArtEvent);
  };

  const renderContent = (arg: EventContentArg) => (
    <div className="text-xs px-1 truncate">{arg.event.title}</div>
  );

  return (
    <FullCalendar
      plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,listMonth',
      }}
      locale="zh-tw"
      buttonText={{ today: '今天', month: '月曆', list: '清單' }}
      events={fcEvents}
      eventClick={handleClick}
      eventContent={renderContent}
      height="auto"
      dayMaxEvents={4}
    />
  );
}
