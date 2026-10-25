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
    case 'warDeclared':
      return `${names.faction(entry.by)}, ${names.faction(entry.target)} devletine savaş ilan etti`;
    case 'peaceMade':
      return `Barış: ${names.faction(entry.a)} ve ${names.faction(entry.b)}${
        entry.tribute === 0
          ? ''
          : ` (haraç: ${names.faction(entry.tribute > 0 ? entry.a : entry.b)} her tur ${Math.abs(entry.tribute)} akçe öder)`
      }`;
    case 'allianceFormed':
      return `Evlilik ittifakı: ${names.faction(entry.a)} ve ${names.faction(entry.b)}`;
    case 'proposalRefused':
      return `${names.faction(entry.to)}, ${names.faction(entry.from)} devletinin ${entry.kind === 'peace' ? 'barış' : 'ittifak'} teklifini reddetti`;
    case 'offerMade':
      return `${names.faction(entry.from)} barış teklif ediyor`;
    case 'offerRejected':
      return `${names.faction(entry.from)} devletinin barış teklifini reddettin`;
    case 'tributePaid':
      return `Haraç: ${names.faction(entry.payer)} → ${names.faction(entry.receiver)}, ${entry.amount} akçe`;
    case 'rulerDied':
      return `${entry.name} ${entry.age} yaşında öldü`;
    case 'newRuler':
      return `${entry.name} tahta çıktı (${entry.age} yaşında)`;
    case 'successionStruggle':
      return `Taht kavgası: ${entry.winner}, ${entry.rivals.join(', ')} karşısında galip geldi`;
    case 'heirBorn':
      return `Şehzade ${entry.name} doğdu`;
    case 'vizierAppointed':
      return `${entry.name} vezir oldu`;
    case 'vizierDied':
      return `Vezir ${entry.name} öldü`;
    case 'janissaryRevolt':
      return `${names.faction(entry.factionId)}: maaşını alamayan yeniçeriler ayaklandı`;
    case 'revolt':
      return `${names.province(entry.provinceId)}: ${entry.kind === 'celali' ? 'Celali isyanı' : 'isyan'} çıktı, bölge elden çıktı`;
    case 'quizAnswered':
      return entry.correct
        ? `Bilgi yarışması: doğru cevap (+${entry.reward} akçe)`
        : 'Bilgi yarışması: yanlış cevap';
    case 'upkeepPaid':
    case 'incomeCollected':
    case 'eventResolved':
      return null;
  }
}
