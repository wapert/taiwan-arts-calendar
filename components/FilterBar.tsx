'use client';

import { EventCategory, CATEGORY_CONFIG } from '@/lib/eventTypes';

const CITY_OPTIONS = [
  { value: 'ALL',       label: '全部城市' },
  { value: 'Taipei',    label: '台北市' },
  { value: 'NewTaipei', label: '新北市' },
  { value: 'Taoyuan',   label: '桃園市' },
  { value: 'Hsinchu',   label: '新竹市' },
  { value: 'Taichung',  label: '台中市' },
  { value: 'Tainan',    label: '台南市' },
  { value: 'Kaohsiung', label: '高雄市' },
];

interface Props {
  activeCategories: Set<EventCategory>;
  activeCity: string;
  onCategoryToggle: (cat: EventCategory) => void;
  onCityChange: (city: string) => void;
  // Dark mode — shown in this bar on mobile, hidden on desktop (header handles it)
  isDark: boolean;
  onToggleDark: () => void;
}

export default function FilterBar({
  activeCategories,
  activeCity,
  onCategoryToggle,
  onCityChange,
  isDark,
  onToggleDark,
}: Props) {
  return (
    <div className="border-b px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-2 sm:items-center"
      style={{ background: 'var(--bg-filterbar)', borderColor: 'var(--border)' }}>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(
          ([key, cfg]) => {
            const active = activeCategories.has(key);
            return (
              <button
                key={key}
                onClick={() => onCategoryToggle(key)}
                className="text-xs font-medium px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border transition-all"
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

      {/* Mobile: city + dark toggle on same row. Desktop: city only (dark toggle is in header) */}
      <div className="flex items-center gap-2 sm:ml-auto">
        <select
          value={activeCity}
          onChange={(e) => onCityChange(e.target.value)}
          className="flex-1 sm:flex-none text-xs sm:text-sm rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        >
          {CITY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Dark mode toggle — only shown here on mobile */}
        <button
          onClick={onToggleDark}
          aria-label="切換深色模式"
          className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex-shrink-0"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          {isDark ? '☀️ 淺色' : '🌙 深色'}
        </button>
      </div>
    </div>
  );
}
