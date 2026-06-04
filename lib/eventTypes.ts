export type EventCategory =
  | 'classical'
  | 'pop'
  | 'theater'
  | 'dance'
  | 'exhibition'
  | 'traditional'
  | 'opera'
  | 'workshop';

export interface ArtEvent {
  id: string;
  title: string;
  start: string;       // ISO date string
  end?: string;
  category: EventCategory;
  venue: string;
  city: string;
  url?: string;
  description?: string;
  imageUrl?: string;
}

export const CATEGORY_CONFIG: Record<
  EventCategory,
  { label: string; labelZh: string; color: string; textColor: string }
> = {
  classical: {
    label: 'Classical / Orchestra',
    labelZh: '古典樂 / 管弦樂',
    color: '#3B82F6',
    textColor: '#fff',
  },
  pop: {
    label: 'Pop / Rock Concert',
    labelZh: '流行音樂 / 演唱會',
    color: '#EF4444',
    textColor: '#fff',
  },
  theater: {
    label: 'Theater / Musical',
    labelZh: '戲劇 / 音樂劇',
    color: '#A0785A',
    textColor: '#fff',
  },
  dance: {
    label: 'Dance',
    labelZh: '舞蹈',
    color: '#F97316',
    textColor: '#fff',
  },
  exhibition: {
    label: 'Exhibition',
    labelZh: '展覽',
    color: '#EAB308',
    textColor: '#000',
  },
  traditional: {
    label: 'Traditional Arts',
    labelZh: '傳統藝術',
    color: '#22C55E',
    textColor: '#fff',
  },
  opera: {
    label: 'Opera / Choral',
    labelZh: '歌劇 / 合唱',
    color: '#EC4899',
    textColor: '#fff',
  },
  workshop: {
    label: 'Workshop / Talk',
    labelZh: '講座 / 工作坊',
    color: '#6B7280',
    textColor: '#fff',
  },
};

export const VENUES: Record<string, { city: string; region: '北部' | '中部' | '南部' }> = {
  '國家兩廳院':        { city: 'Taipei',    region: '北部' },
  '台北表演藝術中心':  { city: 'Taipei',    region: '北部' },
  '北部流行音樂中心':  { city: 'Taipei',    region: '北部' },
  '城市舞台':          { city: 'Taipei',    region: '北部' },
  '新竹市文化局演藝廳': { city: 'Hsinchu',  region: '北部' },
  '桃園市文化局':      { city: 'Taoyuan',   region: '北部' },
  '國家歌劇院':        { city: 'Taichung',  region: '中部' },
  '衛武營國家藝術文化中心': { city: 'Kaohsiung', region: '南部' },
};
