/** Haritada bir ordunun işareti. */
export type ArmyMarker = {
  id: string;
  /** [boylam, enlem]; bölgenin işaret noktası. */
  position: [number, number];
  /** Devletin harita rengi. */
  color: string;
  /** İşaretin üstünde yazan kısa sayı (asker sayısı). */
  label: string;
  /** Ekran okuyucu ve ipucu metni. */
  title: string;
  /** Aynı bölgedeki ordular yan yana dizilir: bu ordunun sırası ve toplamı. */
  index: number;
  count: number;
  /** Oyuncu bu orduya emir verebilir mi? */
  selectable: boolean;
};

const MARKER_WIDTH = 40;
/**
 * Ordu işaretleri bölge noktasının biraz altına konur; böylece bölgedeki şehir
 * ve kale işaretlerini örtmez (E2E testi Bursa'da çakışmayı yakaladı).
 */
const MARKER_DROP = 16;

/** Aynı bölgedeki orduları yatayda ortalayarak yan yana dizen, noktanın altına kaydıran kayma. */
export function markerOffset(index: number, count: number): [number, number] {
  return [(index - (count - 1) / 2) * MARKER_WIDTH, MARKER_DROP];
}

/**
 * Ordu işareti için bir HTML düğmesi üretir. Tıklama MapLibre'ye değil
 * `onSelect`'e gider, böylece bölge seçimi tetiklenmez.
 */
export function createArmyMarkerElement(
  army: ArmyMarker,
  selected: boolean,
  onSelect: (armyId: string) => void,
): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = army.label;
  el.title = army.title;
  el.setAttribute('aria-label', army.title);
  el.setAttribute('aria-pressed', String(selected));
  el.dataset.armyId = army.id;
  el.className = [
    'rounded-full border-2 border-white px-2 py-0.5 text-xs font-semibold text-white shadow-md',
    army.selectable ? 'cursor-pointer' : 'cursor-default',
    selected ? 'ring-4 ring-gold scale-110' : '',
  ].join(' ');
  el.style.backgroundColor = army.color;

  el.addEventListener('click', (event) => {
    event.stopPropagation();
    onSelect(army.id);
  });
  return el;
}
