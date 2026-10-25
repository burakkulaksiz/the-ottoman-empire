/** Haritada bir şehir, kale veya boğaz işareti. */
export type PlaceMarker = {
  id: string;
  name: string;
  /** [boylam, enlem] */
  position: [number, number];
  kind: 'city' | 'strait';
  /** Kale seviyesi (0 = surlu değil). */
  fortification: number;
};

/**
 * Ordu işaretlerinin altında kalan küçük işaret. `onSelect` verilirse
 * tıklanabilir bir düğmedir; tıklama haritaya (bölge seçimine) ulaşmaz.
 */
export function createPlaceMarkerElement(
  place: PlaceMarker,
  onSelect?: (placeId: string) => void,
): HTMLElement {
  const el = document.createElement(onSelect ? 'button' : 'div');
  el.dataset.placeId = place.id;
  if (onSelect) {
    (el as HTMLButtonElement).type = 'button';
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      onSelect(place.id);
    });
  } else {
    el.setAttribute('role', 'img');
  }

  const fortified = place.fortification > 0;
  el.title = fortified
    ? `${place.name} (kale seviyesi ${place.fortification})`
    : place.name;
  el.setAttribute('aria-label', el.title);

  if (place.kind === 'strait') {
    // Boğaz: mavi baklava.
    el.className =
      'size-3 rotate-45 cursor-pointer border border-white bg-sky-700 shadow pointer-events-auto';
  } else if (fortified) {
    // Surlu şehir: kare, seviyeye göre büyür.
    el.className =
      'cursor-pointer border-2 border-white bg-stone-900 shadow pointer-events-auto ' +
      (place.fortification >= 3 ? 'size-4' : 'size-3');
  } else {
    // Surları olmayan şehir: küçük yuvarlak.
    el.className =
      'size-2.5 cursor-pointer rounded-full border border-white bg-stone-700 shadow pointer-events-auto';
  }
  return el;
}
