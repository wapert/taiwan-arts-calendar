'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import FilterBar from '@/components/FilterBar';
import EventModal from '@/components/EventModal';
import MusicBackground from '@/components/MusicBackground';
import { ArtEvent, EventCategory, CATEGORY_CONFIG } from '@/lib/eventTypes';

const CalendarView = dynamic(() => import('@/components/CalendarView'), { ssr: false });

// Default: show only Classical, Theater, Dance
const DEFAULT_CATEGORIES = new Set<EventCategory>(['classical', 'theater', 'dance']);

export default function Home() {
  const [events, setEvents] = useState<ArtEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(DEFAULT_CATEGORIES);
  const [activeCity, setActiveCity] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<ArtEvent | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Load events
  useEffect(() => {
    fetch('/events.json')
      .then((r) => r.json())
      .then((data: ArtEvent[]) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  // Restore dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // useMemo: only recalculate when filter state or events actually change.
  // Without this, toggling dark mode re-ran filter + re-triggered the
  // calendar useEffect (1400 addEvent calls) on every theme switch.
  const filteredEvents = useMemo(
    () => events.filter((e) => {
      const catOk = activeCategories.has(e.category);
      const cityOk = activeCity === 'ALL' || e.city === activeCity;
      return catOk && cityOk;
    }),
    [events, activeCategories, activeCity]
  );

  const toggleCategory = useCallback((cat: EventCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <MusicBackground />

      {/* All content sits above the background symbols */}
      <div className="relative flex flex-col flex-1" style={{ zIndex: 1 }}>

      {/* Header — compact on mobile, full on desktop */}
      <header className="shadow-sm px-3 py-2 sm:px-6 sm:py-3 flex items-center gap-2 border-b"
        style={{ background: 'var(--bg-header)', borderColor: 'var(--border)' }}>

        {/* Title block */}
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--ff-heading)' }}>
            台灣藝文活動月曆
          </h1>
          {/* Subtitle hidden on mobile */}
          <p className="hidden sm:block text-xs"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--ff-heading)', letterSpacing: '0.10em' }}>
            Taiwan Arts &amp; Performance Calendar
          </p>
        </div>

        {/* Cities — desktop only */}
        <span className="hidden lg:block text-xs ml-3 truncate" style={{ color: 'var(--text-muted)' }}>
          台北・新北・桃園・新竹・台中・台南・高雄
        </span>

        {/* Dark mode toggle — icon-only on mobile */}
        <button
          onClick={toggleDark}
          aria-label="切換深色模式"
          className="ml-auto flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer flex-shrink-0"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <span>{isDark ? '☀️' : '🌙'}</span>
          <span className="hidden sm:inline">{isDark ? '淺色' : '深色'}</span>
        </button>
      </header>

      <FilterBar
        activeCategories={activeCategories}
        activeCity={activeCity}
        onCategoryToggle={toggleCategory}
        onCityChange={setActiveCity}
      />

      <div className="flex-1 p-2 sm:p-4">
        <div data-glass className="rounded-2xl shadow p-4" style={{ background: 'var(--bg-surface)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-64 text-sm"
              style={{ color: 'var(--text-muted)' }}>
              載入活動資料中…
            </div>
          ) : (
            <CalendarView events={filteredEvents} onEventClick={setSelectedEvent} />
          )}
        </div>
      </div>

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      </div> {/* end z-index wrapper */}
    </main>
  );
}
