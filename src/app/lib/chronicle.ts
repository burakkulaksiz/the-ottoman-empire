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
import { tTr, type Translate } from '@/lib/i18n';

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
  t: Translate,
): string | null {
  const p = names.province;
  const f = names.faction;
  switch (entry.type) {
    case 'provinceCaptured':
      if (entry.by === player) {
        return t('chronicleEvents.captured', { province: p(entry.provinceId) });
      }
      return entry.from === player
        ? t('chronicleEvents.lost', {
            province: p(entry.provinceId),
            by: f(entry.by),
          })
        : null;
    case 'battleFought':
      if (entry.attackerId !== player && entry.defenderId !== player) {
        return null;
      }
      return t(
        entry.winnerId === player
          ? 'chronicleEvents.battleWon'
          : 'chronicleEvents.battleLost',
        { province: p(entry.provinceId) },
      );
    case 'warDeclared':
      if (entry.by === player) {
        return t('chronicleEvents.warOn', { target: f(entry.target) });
      }
      return entry.target === player
        ? t('chronicleEvents.warBy', { by: f(entry.by) })
        : null;
    case 'peaceMade':
      if (entry.a !== player && entry.b !== player) return null;
      return t('chronicleEvents.peaceWith', {
        faction: f(entry.a === player ? entry.b : entry.a),
      });
    case 'allianceFormed':
      if (entry.a !== player && entry.b !== player) return null;
      return t('chronicleEvents.allianceWith', {
        faction: f(entry.a === player ? entry.b : entry.a),
      });
    case 'eventResolved': {
      const event = scenario.events?.find((e) => e.id === entry.eventId);
      const choice = event?.choices.find((c) => c.id === entry.choiceId);
      return event && choice
        ? t('chronicleEvents.decision', {
            title: event.title,
            choice: choice.label,
          })
        : null;
    }
    case 'rulerDied':
      return t('chronicleEvents.rulerDied', { name: entry.name });
    case 'newRuler':
      return t('chronicleEvents.newRuler', { name: entry.name });
    case 'successionStruggle':
      return t('chronicleEvents.struggle', { winner: entry.winner });
    case 'vizierAppointed':
      return t('chronicleEvents.vizier', { name: entry.name });
    case 'revolt':
      return t('chronicleEvents.revolt', { province: p(entry.provinceId) });
    case 'gameEnded':
      return t(
        entry.status.result === 'victory'
          ? 'chronicleEvents.victory'
          : 'chronicleEvents.defeat',
      );
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
  t: Translate = tTr,
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
    const text = describe(entry, game.playerFactionId, names, scenario, t);
    if (!text) continue;
    const date = dateOfTurn(scenario.startDate, entry.turn);
    row(date.year).played.push({ date: formatDate(date, t), text });
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
