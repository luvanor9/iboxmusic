import { NextRequest, NextResponse } from 'next/server';
import type { ScheduleItem } from '@/lib/radio-config';
import { SCHEDULE as DEFAULT_SCHEDULE } from '@/lib/radio-config';

// In-memory store — persists while the server is running
let currentSchedule: ScheduleItem[] = [...DEFAULT_SCHEDULE];

export async function GET() {
  return NextResponse.json(currentSchedule);
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as ScheduleItem[];
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Array esperado.' }, { status: 400 });
  }
  // Validate each item
  for (const item of body) {
    if (!item.time || !item.show || !item.host || !item.genre || !item.day) {
      return NextResponse.json({ error: 'Campos obrigatórios: day, time, show, host, genre.' }, { status: 400 });
    }
  }
  currentSchedule = body;
  return NextResponse.json({ ok: true });
}
