'use client';

import { EventCategory, CATEGORY_CONFIG } from '@/lib/eventTypes';

const CITIES = ['全部城市', 'Taipei', 'Hsinchu', 'Taoyuan', 'Taichung', 'Kaohsiung'];

interface Props {
  activeCategories: Set<EventCategory>;
  activeCity: string;
  onCategoryToggle: (cat: EventCategory) => void;
  onCityChange: (city: string) => void;
}

export default function FilterBar({
  activeCategories,
  activeCity,
  onCategoryToggle,
  onCityChange,
}: Props) {
  return (
    <div className="border-b px-4 py-3 flex flex-wrap gap-3 items-center"
      style={{ background: 'var(--bg-filterbar)', borderColor: 'var(--border)' }}>
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(
          ([key, cfg]) => {
            const active = activeCategories.has(key);
            return (
              <button
                key={key}
                onClick={() => onCategoryToggle(key)}
                className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                style={{
                  backgroundColor: active ? cfg.color : 'transparent',
                  borderColor: cfg.color,
                  color: active ? cfg.textColor : cfg.color,
                }}
              >
                {cfg.labelZh}
              </button>
            );
          }
        )}
      </div>

      {/* City selector */}
      <select
        value={activeCity}
        onChange={(e) => onCityChange(e.target.value)}
        className="ml-auto text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        style={{
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
        }}
      >
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
