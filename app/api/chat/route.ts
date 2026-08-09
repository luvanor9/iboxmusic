import { NextRequest, NextResponse } from 'next/server';

export interface ChatMessage {
  id: string;
  name: string;
  message: string;
  type: 'chat' | 'request';
  song?: string;
  timestamp: string;
}

// In-memory store (resets on deploy — use a DB for production)
const messages: ChatMessage[] = [
  {
    id: '1',
    name: 'Fã IBOX',
    message: 'Boa tarde galera! Mandando um salve da Bahia 🎶',
    type: 'chat',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: '2',
    name: 'Maria Silva',
    message: 'Pode tocar Evidências do Chitãozinho & Xororó?',
    type: 'request',
    song: 'Evidências — Chitãozinho & Xororó',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: '3',
    name: 'João Pedro',
    message: 'Melhor rádio do Brasil! 🔥',
    type: 'chat',
    timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json(messages.slice(-50));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, message, type, song } = body as {
    name: string;
    message: string;
    type: 'chat' | 'request';
    song?: string;
  };

  if (!name?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Nome e mensagem são obrigatórios.' }, { status: 400 });
  }
  if (name.length > 40 || message.length > 200) {
    return NextResponse.json({ error: 'Texto muito longo.' }, { status: 400 });
  }

  const newMsg: ChatMessage = {
    id: Date.now().toString(),
    name: name.trim(),
    message: message.trim(),
    type: type === 'request' ? 'request' : 'chat',
    song: song?.trim() || undefined,
    timestamp: new Date().toISOString(),
  };

  messages.push(newMsg);
  // keep last 100 only
  if (messages.length > 100) messages.splice(0, messages.length - 100);

  return NextResponse.json(newMsg, { status: 201 });
}
