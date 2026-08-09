import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Simple in-memory signaling for WebRTC peer connections.
 * Stores offers/answers/ICE candidates keyed by roomId.
 * Resets on server restart — sufficient for a single-DJ radio studio.
 */

interface SignalData {
  type: 'offer' | 'answer' | 'ice';
  payload: unknown;
  from: 'studio' | 'caller';
  timestamp: number;
}

const rooms = new Map<string, SignalData[]>();

function getRoom(id: string): SignalData[] {
  if (!rooms.has(id)) rooms.set(id, []);
  return rooms.get(id)!;
}

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get('room') ?? 'default';
  const since = parseInt(req.nextUrl.searchParams.get('since') ?? '0', 10);
  const from  = req.nextUrl.searchParams.get('from') ?? '';

  const room = getRoom(roomId);
  // Return only signals NOT from the same peer and newer than `since`
  const signals = room.filter(s => s.from !== from && s.timestamp > since);
  return NextResponse.json(signals);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as SignalData & { room?: string };
  const roomId = body.room ?? 'default';

  if (!['offer', 'answer', 'ice'].includes(body.type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const room = getRoom(roomId);
  const signal: SignalData = {
    type: body.type,
    payload: body.payload,
    from: body.from === 'studio' ? 'studio' : 'caller',
    timestamp: Date.now(),
  };
  room.push(signal);

  // Keep only last 50 signals per room
  if (room.length > 50) room.splice(0, room.length - 50);

  // Prune old signals (> 2 min)
  const cutoff = Date.now() - 120_000;
  const fresh = room.filter(s => s.timestamp > cutoff);
  rooms.set(roomId, fresh);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get('room') ?? 'default';
  rooms.delete(roomId);
  return NextResponse.json({ ok: true });
}
