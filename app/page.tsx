'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import FilterBar from '@/components/FilterBar';
import Legend from '@/components/Legend';
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

  const filteredEvents = events.filter((e) => {
    const catOk = activeCategories.has(e.category);
    const cityOk = activeCity === 'ALL' || e.city === activeCity;
    return catOk && cityOk;
  });

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

      {/* Header */}
      <header className="shadow-sm px-6 py-4 flex items-center gap-3 border-b"
        style={{ background: 'var(--bg-header)', borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            台灣藝文活動月曆
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Taiwan Arts &amp; Performance Calendar
          </p>
        </div>

        <span className="hidden sm:block text-xs ml-4" style={{ color: 'var(--text-muted)' }}>
          台北・新北・新竹・桃園・台中・台南・高雄
        </span>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          aria-label="切換深色模式"
          className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          {isDark ? '☀️ 淺色' : '🌙 深色'}
        </button>
      </header>

      <FilterBar
        activeCategories={activeCategories}
        activeCity={activeCity}
        onCategoryToggle={toggleCategory}
        onCityChange={setActiveCity}
      />

      <Legend />

      <div className="flex-1 p-4">
        <div className="rounded-2xl shadow p-4" style={{ background: 'var(--bg-surface)' }}>
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
