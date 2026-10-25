import type { EndReason } from '@/engine';

export const END_REASON_LABELS: Record<EndReason, string> = {
  eliminated: 'Devletin tarih sahnesinden çekildi.',
  lastStanding: 'Tüm rakiplerini yendin.',
  objectives: 'Senaryonun hedeflerini tamamladın.',
  timeLimit: 'Süre doldu.',
};
