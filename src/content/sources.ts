/**
 * Kaynakça (D6). Ansiklopedi maddeleri, olay kartları ve kronoloji bu
 * listedeki eserlere atıf yapar.
 *
 * TODO(kaynak): Atıflara sayfa numaraları eklenecek ve her atıf bir tarihçi
 * tarafından gözden geçirilecek. Şimdilik atıflar "bu konuyu ele alan
 * başvuru eseri" anlamındadır.
 */
export type SourceKind = 'primary' | 'secondary' | 'reference' | 'data';

export interface Source {
  id: string;
  author: string;
  title: string;
  /** Kısa gösterim, örn. kroniklerde "İnalcık". */
  short: string;
  publisher?: string;
  year?: string;
  kind: SourceKind;
  url?: string;
  note?: string;
}

/** Bir maddedeki atıf: hangi eser ve (varsa) eserin hangi bölümü/maddesi. */
export interface Citation {
  source: string;
  locator?: string;
}

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  primary: 'Birincil kaynaklar',
  secondary: 'Araştırmalar',
  reference: 'Başvuru eserleri',
  data: 'Veri kaynakları',
};

export const SOURCES: Source[] = [
  {
    id: 'asikpasazade',
    author: 'Âşıkpaşazâde',
    title: 'Tevârîh-i Âl-i Osman',
    short: 'Âşıkpaşazâde',
    year: '15. yüzyıl',
    kind: 'primary',
    note: 'Erken Osmanlı tarihine dair en önemli Osmanlı kroniklerinden biri; kuruluş dönemi rivayetlerinin başlıca kaynağı.',
  },
  {
    id: 'pachymeres',
    author: 'Georgios Pachymeres',
    title: 'Syngraphikai Historiai (Tarih)',
    short: 'Pachymeres',
    year: '14. yüzyıl başı',
    kind: 'primary',
    note: 'Çağdaş Bizans tarihçisi; Koyunhisar (Bafeus) Savaşı’nı anlatan başlıca kaynak.',
  },
  {
    id: 'inalcik-klasik-cag',
    author: 'Halil İnalcık',
    title: 'Osmanlı İmparatorluğu: Klasik Çağ (1300–1600)',
    short: 'İnalcık',
    publisher: 'Yapı Kredi Yayınları',
    year: 'İngilizce ilk baskı 1973',
    kind: 'secondary',
  },
  {
    id: 'imber-structure',
    author: 'Colin Imber',
    title: 'The Ottoman Empire, 1300–1650: The Structure of Power',
    short: 'Imber',
    publisher: 'Palgrave Macmillan',
    year: '2002',
    kind: 'secondary',
  },
  {
    id: 'finkel-osmans-dream',
    author: 'Caroline Finkel',
    title: "Osman's Dream: The Story of the Ottoman Empire 1300–1923",
    short: 'Finkel',
    publisher: 'John Murray',
    year: '2005',
    kind: 'secondary',
  },
  {
    id: 'kafadar-two-worlds',
    author: 'Cemal Kafadar',
    title: 'Between Two Worlds: The Construction of the Ottoman State',
    short: 'Kafadar',
    publisher: 'University of California Press',
    year: '1995',
    kind: 'secondary',
  },
  {
    id: 'lindner-prehistory',
    author: 'Rudi Paul Lindner',
    title: 'Explorations in Ottoman Prehistory',
    short: 'Lindner',
    publisher: 'University of Michigan Press',
    year: '2007',
    kind: 'secondary',
  },
  {
    id: 'kastritsis-sons',
    author: 'Dimitris J. Kastritsis',
    title:
      'The Sons of Bayezid: Empire Building and Representation in the Ottoman Civil War of 1402–13',
    short: 'Kastritsis',
    publisher: 'Brill',
    year: '2007',
    kind: 'secondary',
  },
  {
    id: 'pamuk-monetary',
    author: 'Şevket Pamuk',
    title: 'A Monetary History of the Ottoman Empire',
    short: 'Pamuk',
    publisher: 'Cambridge University Press',
    year: '2000',
    kind: 'secondary',
  },
  {
    id: 'barkey-bandits',
    author: 'Karen Barkey',
    title: 'Bandits and Bureaucrats: The Ottoman Route to State Centralization',
    short: 'Barkey',
    publisher: 'Cornell University Press',
    year: '1994',
    kind: 'secondary',
  },
  {
    id: 'tdv-ia',
    author: 'Türkiye Diyanet Vakfı',
    title: 'TDV İslâm Ansiklopedisi',
    short: 'TDV İA',
    kind: 'reference',
    url: 'https://islamansiklopedisi.org.tr',
  },
  {
    id: 'natural-earth',
    author: 'Natural Earth',
    title:
      'Natural Earth harita verileri (1:10m idari bölümler, nehirler, kara)',
    short: 'Natural Earth',
    kind: 'data',
    url: 'https://www.naturalearthdata.com',
    note: 'Bölge sınırları, kıyılar ve nehirler bu açık veriden üretilmiştir; sınırlar moderndir.',
  },
];

export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}

/** "Halil İnalcık, Osmanlı İmparatorluğu: Klasik Çağ — “Tımar”" biçiminde. */
export function formatCitation(citation: Citation): string {
  const source = getSource(citation.source);
  if (!source) return citation.source;
  const base = `${source.author}, ${source.title}`;
  return citation.locator ? `${base} (${citation.locator})` : base;
}
