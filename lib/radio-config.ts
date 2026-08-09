/**
 * IBOX MUSIC — Configuração Central da Rádio
 * Edite este arquivo para personalizar sua rádio.
 */

export const RADIO_CONFIG = {
  name: 'IBOX MUSIC',
  tagline: 'A Sintonia que te Aproxima de Deus · Brazabrantes – Goiás',
  slogan: 'A melhor música, onde você estiver.',

  /**
   * URL do stream de áudio.
   * Para AzuraCast: https://seuservidor.com/radio/8000/radio.mp3
   * Para Icecast: http://seuservidor.com:8000/stream
   * Para Shoutcast: http://seuservidor.com:8000/;stream.mp3
   * Coloque a URL do seu servidor aqui quando estiver configurado.
   */
  streamUrl: 'https://streams.br10.com.br/iboxmusic',

  /** Fallback caso o stream principal falhe */
  streamUrlFallback: '',

  /** Estação de demonstração (SHOUTcast público para teste) */
  streamDemo: 'https://streams.br10.com.br/iboxmusic',

  socials: {
    /**
     * Para trocar o número do WhatsApp depois:
     * Altere apenas o número abaixo (só dígitos, com DDI 55 + DDD + número).
     * Exemplo: 5562999991234
     */
    whatsapp: 'https://wa.me/5562994447893',
    /** Deixe vazio ('') para ocultar o botão na página */
    instagram: '',
    facebook: '',
    youtube: '',
  },

  contact: {
    phone: '',
    email: '',
  },

  /** Cor de destaque (usada em meta theme-color também) */
  accentColor: '#FF6B2B',
};

export const SCHEDULE: ScheduleItem[] = [
  { day: 'Seg – Sex', time: '06:00', show: 'Manhã IBOX', host: 'DJ Carlos', genre: 'Pop / Hits' },
  { day: 'Seg – Sex', time: '10:00', show: 'Trabalho & Ritmo', host: 'DJ Paula', genre: 'Eletrônico' },
  { day: 'Seg – Sex', time: '14:00', show: 'Tarde Musical', host: 'DJ Bruno', genre: 'Sertanejo' },
  { day: 'Seg – Sex', time: '18:00', show: 'Rush Hour', host: 'DJ Bia', genre: 'Funk / Trap' },
  { day: 'Seg – Sex', time: '22:00', show: 'Night Box', host: 'DJ Léo', genre: 'House / Tech' },
  { day: 'Sáb',       time: '12:00', show: 'Sábado Total', host: 'DJ Marcos', genre: 'MPB / Pop' },
  { day: 'Sáb',       time: '22:00', show: 'IBOX Party', host: 'DJ Night', genre: 'Dance / EDM' },
  { day: 'Dom',       time: '10:00', show: 'Domingo Gospel', host: 'Apresentador', genre: 'Gospel' },
  { day: 'Dom',       time: '18:00', show: 'Flashback',     host: 'DJ Retro', genre: 'Anos 80/90' },
];

export interface ScheduleItem {
  day: string;
  time: string;
  show: string;
  host: string;
  genre: string;
}
