import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ArtEvent, EventCategory } from '@/lib/eventTypes';

function loadEvents(): ArtEvent[] {
  try {
    const file = join(process.cwd(), 'public', 'events.json');
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as EventCategory | null;
  const city = searchParams.get('city');

  let events = loadEvents();

  if (category) {
    events = events.filter((e) => e.category === category);
  }
  if (city) {
    events = events.filter((e) => e.city.toLowerCase() === city.toLowerCase());
  }

  return NextResponse.json(events);
}
