import type { LogEntry } from '@/engine';

import { formatDate } from '../config/season-labels';
import { UNIT_LABELS } from '../config/unit-labels';

/** Günlük metinlerinde kullanılacak adlar; içerik katmanından gelir. */
export interface LogNames {
  province(id: string): string;
  faction(id: string): string;
  event(id: string): string;
}

/** Günlük kaydını okunur Türkçe metne çevirir; gösterilmeyecekse `null`. */
export function formatLogEntry(
  entry: LogEntry,
  names: LogNames,
): string | null {
  switch (entry.type) {
    case 'turnStarted':
      return `— ${formatDate(entry.date)} —`;
    case 'armyMoved':
      return `${names.faction(entry.factionId)}: ${names.province(entry.from)} → ${names.province(entry.to)}`;
    case 'battleFought':
      return `Savaş (${names.province(entry.provinceId)}): ${names.faction(entry.attackerId)} saldırdı, ${names.faction(entry.winnerId)} kazandı — kayıp ${entry.attackerLosses} / ${entry.defenderLosses}`;
    case 'armyRetreated':
      return `Ordu geri çekildi: ${names.province(entry.from)} → ${names.province(entry.to)}`;
    case 'armyDestroyed':
      return `${names.faction(entry.factionId)} ordusu dağıldı`;
    case 'provinceCaptured':
      return `${names.province(entry.provinceId)} ele geçirildi (${names.faction(entry.by)})`;
    case 'siegeStarted':
      return `${names.province(entry.provinceId)} kuşatılıyor (${names.faction(entry.attackerId)})`;
    case 'siegeLifted':
      return `${names.province(entry.provinceId)} kuşatması kalktı`;
    case 'winterAttrition':
      return `${names.province(entry.provinceId)}: kışlaksız ordu ${entry.lost} asker yitirdi`;
    case 'eventTriggered':
      return `Olay: ${names.event(entry.eventId)}`;
    case 'factionEliminated':
      return `${names.faction(entry.factionId)} tarih sahnesinden çekildi`;
    case 'gameEnded':
      return `Oyun bitti: ${entry.status.result === 'victory' ? 'Zafer' : 'Yenilgi'}`;
    case 'recruited':
      return `${names.faction(entry.factionId)}: ${names.province(entry.provinceId)} bölgesinde ${entry.amount} ${UNIT_LABELS[entry.unit]} devşirildi (${entry.cost} akçe)`;
    case 'troopsUnpaid':
      return `${names.faction(entry.factionId)}: maaşlar ödenemedi (eksik ${entry.shortfall} akçe), kapıkulu kaçıyor ve morali düşüyor`;
    case 'upkeepPaid':
    case 'incomeCollected':
    case 'eventResolved':
      return null;
  }
}
