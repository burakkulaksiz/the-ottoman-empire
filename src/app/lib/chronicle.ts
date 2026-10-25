import type { ScenarioDefinition } from '@/content/scenarios';
import { getSource } from '@/content/sources';
import {
  nextDate,
  type GameDate,
  type GameState,
  type LogEntry,
} from '@/engine';
import { formatDate } from '@/features/game/config/season-labels';
import type { LogNames } from '@/features/game/lib/format-log-entry';

export interface ChronicleRow {
  year: number;
  /** Oyuncunun yazdığı tarih: o yılın önemli olayları. */
  played: { date: string; text: string }[];
  /** Gerçek tarih; `source` kısa kaynak gösterimidir (D6). */
  history: { date: string; text: string; source?: string }[];
}

/** Senaryo başlangıcından `turn` turunun tarihi (her tur bir mevsim). */
export function dateOfTurn(start: GameDate, turn: number): GameDate {
  let date = start;
  for (let i = 1; i < turn; i++) date = nextDate(date);
  return date;
}

/**
 * Oyuncunun kroniğine giren olaylar: kendi savaşları, fetihleri ve kayıpları,
 * diplomasi, saray, kararlar ve isyanlar. Diğer devletlerin işleri girmez.
 */
function describe(
  entry: LogEntry,
  player: string,
  names: LogNames,
  scenario: ScenarioDefinition,
): string | null {
  switch (entry.type) {
    case 'provinceCaptured':
      if (entry.by === player) {
        return `${names.province(entry.provinceId)} ele geçirildi.`;
      }
      return entry.from === player
        ? `${names.province(entry.provinceId)}, ${names.faction(entry.by)} eline geçti.`
        : null;
    case 'battleFought':
      if (entry.attackerId !== player && entry.defenderId !== player) {
        return null;
      }
      return `${names.province(entry.provinceId)} savaşı ${
        entry.winnerId === player ? 'kazanıldı' : 'kaybedildi'
      }.`;
    case 'warDeclared':
      if (entry.by === player) {
        return `${names.faction(entry.target)} devletine savaş ilan edildi.`;
      }
      return entry.target === player
        ? `${names.faction(entry.by)} savaş ilan etti.`
        : null;
    case 'peaceMade':
      if (entry.a !== player && entry.b !== player) return null;
      return `${names.faction(entry.a === player ? entry.b : entry.a)} ile barış yapıldı.`;
    case 'allianceFormed':
      if (entry.a !== player && entry.b !== player) return null;
      return `${names.faction(entry.a === player ? entry.b : entry.a)} ile evlilik ittifakı kuruldu.`;
    case 'eventResolved': {
      const event = scenario.events?.find((e) => e.id === entry.eventId);
      const choice = event?.choices.find((c) => c.id === entry.choiceId);
      return event && choice ? `${event.title}: ${choice.label}.` : null;
    }
    case 'rulerDied':
      return `${entry.name} öldü.`;
    case 'newRuler':
      return `${entry.name} tahta çıktı.`;
    case 'successionStruggle':
      return `Taht kavgası: ${entry.winner} galip geldi.`;
    case 'vizierAppointed':
      return `${entry.name} vezir oldu.`;
    case 'revolt':
      return `${names.province(entry.provinceId)} isyan edip elden çıktı.`;
    case 'gameEnded':
      return entry.status.result === 'victory' ? 'Zafer!' : 'Yenilgi.';
    default:
      return null;
  }
}

/**
 * Oyuncunun tarihini gerçek tarihle yıl yıl yan yana dizer. Gerçek tarih,
 * oyunda henüz gelinmemiş yıllar için gösterilmez (ipucu vermemek için).
 */
export function buildChronicle(
  game: GameState,
  scenario: ScenarioDefinition,
  names: LogNames,
): ChronicleRow[] {
  const rows = new Map<number, ChronicleRow>();
  const row = (year: number) => {
    let found = rows.get(year);
    if (!found) {
      found = { year, played: [], history: [] };
      rows.set(year, found);
    }
    return found;
  };

  for (const entry of game.log) {
    const text = describe(entry, game.playerFactionId, names, scenario);
    if (!text) continue;
    const date = dateOfTurn(scenario.startDate, entry.turn);
    row(date.year).played.push({ date: formatDate(date), text });
  }

  for (const item of scenario.chronicle ?? []) {
    if (item.year > game.date.year) continue;
    row(item.year).history.push({
      date: item.dateLabel ?? String(item.year),
      text: item.text,
      source: item.sources
        ?.map((c) => getSource(c.source)?.short ?? c.source)
        .join(', '),
    });
  }

  return [...rows.values()].sort((a, b) => a.year - b.year);
}
