import type { EndReason } from '@/engine';
import { tTr, type Translate } from '@/lib/i18n';

export function endReasonLabel(reason: EndReason, t: Translate = tTr): string {
  return t(`gameOver.${reason}`);
}
