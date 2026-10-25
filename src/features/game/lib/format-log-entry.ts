import type { LogEntry } from '@/engine';
import { tTr, type Translate } from '@/lib/i18n';

import { formatDate } from '../config/season-labels';
import { unitLabel } from '../config/unit-labels';

/** Günlük metinlerinde kullanılacak adlar; içerik katmanından gelir. */
export interface LogNames {
  province(id: string): string;
  faction(id: string): string;
  event(id: string): string;
}

/** Günlük kaydını okunur metne çevirir; gösterilmeyecekse `null`. */
export function formatLogEntry(
  entry: LogEntry,
  names: LogNames,
  t: Translate = tTr,
): string | null {
  const p = names.province;
  const f = names.faction;
  switch (entry.type) {
    case 'turnStarted':
      return `— ${formatDate(entry.date, t)} —`;
    case 'armyMoved':
      return `${f(entry.factionId)}: ${p(entry.from)} → ${p(entry.to)}`;
    case 'battleFought':
      return t('log.battle', {
        province: p(entry.provinceId),
        attacker: f(entry.attackerId),
        winner: f(entry.winnerId),
        attackerLosses: entry.attackerLosses,
        defenderLosses: entry.defenderLosses,
      });
    case 'armyRetreated':
      return t('log.retreated', { from: p(entry.from), to: p(entry.to) });
    case 'armyDestroyed':
      return t('log.destroyed', { faction: f(entry.factionId) });
    case 'provinceCaptured':
      return t('log.captured', {
        province: p(entry.provinceId),
        by: f(entry.by),
      });
    case 'siegeStarted':
      return t('log.siegeStarted', {
        province: p(entry.provinceId),
        by: f(entry.attackerId),
      });
    case 'siegeLifted':
      return t('log.siegeLifted', { province: p(entry.provinceId) });
    case 'winterAttrition':
      return t('log.winterAttrition', {
        province: p(entry.provinceId),
        lost: entry.lost,
      });
    case 'eventTriggered':
      return t('log.event', { title: names.event(entry.eventId) });
    case 'factionEliminated':
      return t('log.eliminated', { faction: f(entry.factionId) });
    case 'gameEnded':
      return t('log.gameEnded', {
        result: t(
          entry.status.result === 'victory'
            ? 'common.victory'
            : 'common.defeat',
        ),
      });
    case 'recruited':
      return t('log.recruited', {
        faction: f(entry.factionId),
        province: p(entry.provinceId),
        amount: entry.amount,
        unit: unitLabel(entry.unit, t),
        cost: entry.cost,
      });
    case 'troopsUnpaid':
      return t('log.unpaid', {
        faction: f(entry.factionId),
        shortfall: entry.shortfall,
      });
    case 'warDeclared':
      return t('log.warDeclared', { by: f(entry.by), target: f(entry.target) });
    case 'peaceMade':
      return entry.tribute === 0
        ? t('log.peace', { a: f(entry.a), b: f(entry.b) })
        : t('log.peaceTribute', {
            a: f(entry.a),
            b: f(entry.b),
            payer: f(entry.tribute > 0 ? entry.a : entry.b),
            amount: Math.abs(entry.tribute),
          });
    case 'allianceFormed':
      return t('log.alliance', { a: f(entry.a), b: f(entry.b) });
    case 'proposalRefused':
      return t(
        entry.kind === 'peace' ? 'log.peaceRefused' : 'log.allianceRefused',
        { to: f(entry.to), from: f(entry.from) },
      );
    case 'offerMade':
      return t('log.offerMade', { from: f(entry.from) });
    case 'offerRejected':
      return t('log.offerRejected', { from: f(entry.from) });
    case 'tributePaid':
      return t('log.tribute', {
        payer: f(entry.payer),
        receiver: f(entry.receiver),
        amount: entry.amount,
      });
    case 'rulerDied':
      return t('log.rulerDied', { name: entry.name, age: entry.age });
    case 'newRuler':
      return t('log.newRuler', { name: entry.name, age: entry.age });
    case 'successionStruggle':
      return t('log.struggle', {
        winner: entry.winner,
        rivals: entry.rivals.join(', '),
      });
    case 'heirBorn':
      return t('log.heirBorn', { name: entry.name });
    case 'vizierAppointed':
      return t('log.vizierAppointed', { name: entry.name });
    case 'vizierDied':
      return t('log.vizierDied', { name: entry.name });
    case 'janissaryRevolt':
      return t('log.janissaries', { faction: f(entry.factionId) });
    case 'revolt':
      return t(entry.kind === 'celali' ? 'log.celali' : 'log.revolt', {
        province: p(entry.provinceId),
      });
    case 'quizAnswered':
      return entry.correct
        ? t('log.quizRight', { reward: entry.reward })
        : t('log.quizWrong');
    case 'upkeepPaid':
    case 'incomeCollected':
    case 'eventResolved':
      return null;
  }
}
