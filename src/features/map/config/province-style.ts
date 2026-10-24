import type { ExpressionSpecification } from 'maplibre-gl';

export const PROVINCE_SOURCE = 'provinces';
export const PROVINCE_FILL_LAYER = 'provinces-fill';

const NO_OWNER_COLOR = 'rgba(0, 0, 0, 0)';

/**
 * Sahibi olan bölgeleri devletinin rengine boyayan ifade. Sahipsiz bölgeler
 * saydam kalır, altındaki kara rengi görünür.
 */
export function ownerFillColor(
  owners: Record<string, string | null>,
  factionColors: Record<string, string>,
): ExpressionSpecification | string {
  const idsByColor = new Map<string, string[]>();
  for (const [provinceId, factionId] of Object.entries(owners)) {
    const color = factionId ? factionColors[factionId] : undefined;
    if (!color) continue;
    const ids = idsByColor.get(color);
    if (ids) ids.push(provinceId);
    else idsByColor.set(color, [provinceId]);
  }
  if (idsByColor.size === 0) return NO_OWNER_COLOR;

  const branches = [...idsByColor].flatMap(([color, ids]) => [ids, color]);
  return [
    'match',
    ['get', 'id'],
    ...branches,
    NO_OWNER_COLOR,
  ] as unknown as ExpressionSpecification;
}
