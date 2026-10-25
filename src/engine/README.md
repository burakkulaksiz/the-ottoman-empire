# engine

Saf TypeScript oyun motoru. React, router veya store import edemez (ESLint ile denetlenir); bu sayede ileride Web Worker'da veya sunucuda aynen çalışır.

> Arayüz motoru doğrudan çağırmaz: motor `src/workers` içinde bir Web Worker'da çalışır ve `src/stores/game-store.ts` köprüsü üzerinden kullanılır. Bu yüzden `GameState` yapısal klonlanabilir (düz JSON benzeri) kalmalıdır.

## Temel kavramlar

- **`World`**: statik dünya (sancaklar, komşuluklar, devletler). İçerikten gelir, kayda yazılmaz.
- **`GameState`**: değişen oyun durumu. Düz JSON'dur; kaydedilebilir ve karşılaştırılabilir.
- **`dispatch`**: tek giriş noktası. Komutu doğrular, Immer ile uygular, yeni durumu ve log kayıtlarını döndürür. Girdi durumu asla değişmez.
- **Tur akışı**: oyuncu emir verir → `endTurn` → yapay zekâ devletleri sırayla hamle yapar → `TURN_PHASES` (takvim, hareket yenileme, gelir, eleme, oyun sonu).
- **Determinizm**: RNG durumu `GameState.rng` içinde. Aynı tohum ve aynı komutlar her zaman aynı oyunu üretir; yapay zekâ `Math.random` yerine `context.random` kullanmalı.

```ts
import { createGame, dispatch, seedFromString } from '@/engine';

let state = createGame(scenario, { seed: seedFromString('osman-1299') });

const result = dispatch(scenario.world, state, state.playerFactionId, {
  type: 'moveArmy',
  armyId: 'army-1',
  to: 'bilecik',
});
if (result.ok) state = result.state;
else console.warn(result.error); // 'notAdjacent', 'noMovesLeft', ...
```

## Mevsimler ve kışlak (C1)

Her tur bir mevsimdir (ilkbahar → yaz → sonbahar → kış). İlkbahar–sonbahar sefer mevsimidir; kışın ordu yalnızca kendi toprağına çekilebilir (`winterQuarters` hatası) ve kış başında yabancı toprakta kalan ordu `RULES.winterAttritionRate` oranında asker kaybeder (`winterAttrition` günlük kaydı).

## Ordular, savaş ve kuşatma (C4, C5)

- **Ordu**: `units` (akıncı, sipahi, yaya, yeniçeri, topçu sayıları) ve `morale` (0–100). Birimler `units.ts` içinde; `minYear`'dan önce senaryoya konamaz.
- **Savaş**: Düşman ordusu bulunan bölgeye giren ordu savaşır (`combat.ts`). Güç = Σ birlik × (saldırı|savunma) × moral çarpanı; savunmacıya arazi ve (toprağın sahibiyse) kale çarpanı, iki tarafa tohumlu ± zar. Kaybeden geri çekilir (saldıran geldiği bölgeye) ya da kaçacak yer yoksa dağılır. Diplomasi (C7) gelene kadar farklı her devlet düşmandır.
- **Fetih**: Karşısında ordu olmayan düşman/sahipsiz bölge kalesizse hemen alınır; kaleliyse (`fortification > 0`) kuşatma başlar, `fortification × siegeTurnsPerFortLevel` tur sonra düşer (topçu oranı süreyi kısaltır). Kuşatan ordu ayrılır ya da yenilirse kuşatma kalkar (`siege.ts`).
- **Moral**: tur sonunda kendi toprağında +10, yabancı toprakta −5; savaşı kazanan +10, kaybeden −25.
- Denge sabitleri `rules.ts` içindedir. `ProvinceDef.terrain` ve `fortification` isteğe bağlıdır; gerçek veri B4'te gelecek.

## Zafer, yenilgi ve tarihe göre puan (C3)

`World` içinde (senaryodan gelir): `objectives` (oyuncunun hedefleri), `endDate` (zaman sınırı) ve `historical` (tarihî sonuç). `checkGameOver` aşaması her tur sırayla bakar:

1. Oyuncunun devleti yıkıldı → yenilgi (`eliminated`)
2. Tüm hedefler tamam → zafer (`objectives`)
3. Rakip kalmadı → zafer (`lastStanding`)
4. `endDate`'e gelindi → hedefi olan senaryoda yenilgi, hedefsiz (hayatta kalma) senaryoda zafer (`timeLimit`)

Oyun sonunda `status.score` tarihî bölge sayısıyla kıyaslar: `points` 100 = tarihle aynı, `verdict` ±%10 toleransla `better | same | worse` (`RULES.historicalTolerance`). Hedef ilerlemesi için `objectiveProgress(world, state)`.

## Tarihî olay kartları (D1)

`World.events` olayları tanımlar: `id`, `trigger` (`date` ya da `ownsProvince`) ve `choices` (her seçeneğin `effects` listesi: `treasury`, `morale`). Metinler (başlık, açıklama, "Tarihte gerçekte ne oldu?") içerik katmanındadır; motor yalnızca kimlikleri bilir.

- `triggerEvents` tur aşaması koşulu gerçekleşen olayı `state.events.pending` listesine koyar (her olay en fazla bir kez).
- Bekleyen olay varken `endTurn` `eventPending` hatası verir; oyuncu `{ type: 'chooseEvent', eventId, choiceId }` ile karar verir.
- Seçimler `state.events.choices` içinde saklanır (D2'de tarihle karşılaştırılacak).

## Ekonomi (C6)

- **Gelir**: her tur sahip olunan bölgelerin `baseTax`ı hazineye eklenir (`incomeOf`). İçerik katmanı `baseTax`ı tarım + şehirler + ticaret yolu gümrüğü olarak hesaplar.
- **Devşirme**: `{ type: 'recruit', provinceId, unit }` bölgede `RULES.recruitBatch` (100) asker getirir, `UNIT_DEFS[unit].cost` akçe öder, bölgede ordu varsa ona katılır yoksa yeni ordu kurulur (o tur yürümez). Bölge başına tur başı `recruitOrdersPerProvince` emir; kuşatılan bölgede, başkasının bölgesinde ve henüz açılmamış birlikte yapılamaz. Arayüz için `recruitOptions`.
- **Maaş**: tımarlı sipahi ve akıncı (`upkeep: 0`) toprak gelirinden geçinir; yaya, yeniçeri, topçu nakit maaş alır (`upkeepOf`). `payUpkeep` aşaması tur sonunda öder; ödenemezse ordunun morali düşer ve maaşlı birliklerden asker kaçar.

## Diplomasi (C7)

- `state.diplomacy.relations`: çift (`pairKey`) → `war | peace | alliance`. Senaryo `relations` vermezse herkes savaştadır (eski davranış).
- Yalnızca **savaştaki** devletlerin orduları çarpışır ve toprakları alınabilir (`isHostile`). Barıştaki devletin topraklarına girilemez (`atPeace`); müttefik toprağından geçilir.
- Komutlar: `declareWar`, `proposePeace` (`tribute` > 0 öneren öder, < 0 öneren ister), `proposeAlliance` (çeyiz, ortak düşman şartı), `respondOffer` (yapay zekânın oyuncuya teklifi). Kabul kuralları `acceptsPeace` / `acceptsAlliance` (deterministik). Aynı çifte tur başına bir teklif.
- Haraçlar `payTributes` aşamasında ödenir; barış yapılınca iki taraf arasındaki kuşatmalar kalkar; cevaplanmayan teklifler tur sonunda düşer.

## Yapay zekâ (C9)

`dispatch`'e `{ ai }` verilir; varsayılan `passiveAi` hiçbir şey yapmaz, uygulama `heuristicAi` kullanır (`engine-api.ts`). `createHeuristicAi({ aggression })` her ordunun komşu bölgelerini puanlar: savunmasız düşman toprağı, kazanılabilir savaş (güç oranı ≥ `aggression`, `battleOdds` ile zarsız hesaplanır), kışın eve dönüş ve düşman sınırına yaklaşma. Sahipsiz bölgelere yayılmaz. Devşirme bütçesi tur gelirinin `recruitShare` oranıdır; devlet başına `FactionDef.ai` (`aggression`, `recruitShare`) kişilik verir (1299'da Bizans temkinli ve az devşirir). Rastgelelik yalnızca verilen `random()` ile (deterministik).

## Yeni mekanik eklemek

- **Yeni emir**: `commands/types.ts` içindeki `ActionCommand` birleşimine ekle, `commands/<emir>.ts` içinde `validate…` / `execute…` yaz, `commands/index.ts` içindeki `switch`'lere bağla.
- **Yeni tur aşaması**: `turn/phases.ts` içinde bir `TurnPhase` yaz ve `TURN_PHASES` listesine doğru sıraya koy.
