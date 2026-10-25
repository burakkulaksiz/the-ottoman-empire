import { PLACES } from './places';

export interface TradeRoute {
  id: string;
  name: string;
  /** Güzergâhın uğradığı yerlerin kimlikleri (`PLACES`), sırayla. */
  via: string[];
  note?: string;
}

/**
 * Ticaret yolları (şematik): şimdilik yalnızca haritada gösterilir; gelir ve
 * kervan kuralları ekonomiyle (C6) gelecek.
 *
 * TODO(kaynak): Güzergâhlar ve dönemleri doğrulanmalı (D6). Çizgiler gerçek
 * yolu değil, uğranan şehirleri düz çizgilerle bağlar.
 */
export const TRADE_ROUTES: TradeRoute[] = [
  {
    id: 'ipek-yolu-trabzon',
    name: 'İpek Yolu: Tebriz – Erzurum – Trabzon',
    via: ['tebriz', 'erzurum', 'trabzon'],
    note: "İran ve Orta Asya ipeğinin Karadeniz'e açılan kolu.",
  },
  {
    id: 'via-militaris',
    name: 'Büyük Rumeli Yolu: İstanbul – Edirne – Sofya – Belgrad',
    via: ['istanbul', 'edirne', 'sofya', 'belgrad'],
    note: "Roma ve Bizans'tan beri Balkanlar'ı Orta Avrupa'ya bağlayan ana yol.",
  },
  {
    id: 'halep-kahire',
    name: 'Kervan Yolu: Halep – Şam – Kahire',
    via: ['halep', 'sam', 'kahire'],
    note: "Suriye ile Mısır'ı bağlayan kervan hattı.",
  },
];

/** Yolun çizileceği [boylam, enlem] noktaları. */
export function routePath(route: TradeRoute): [number, number][] {
  return route.via.map((id) => {
    const place = PLACES.find((p) => p.id === id);
    if (!place)
      throw new Error(`Trade route "${route.id}": unknown place "${id}"`);
    return place.position;
  });
}
