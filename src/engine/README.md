# engine

Saf TypeScript oyun motoru. React, router veya store import edemez (ESLint ile denetlenir); bu sayede ileride Web Worker'da veya sunucuda aynen çalışır.

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

## Yeni mekanik eklemek

- **Yeni emir**: `commands/types.ts` içindeki `ActionCommand` birleşimine ekle, `commands/<emir>.ts` içinde `validate…` / `execute…` yaz, `commands/index.ts` içindeki `switch`'lere bağla.
- **Yeni tur aşaması**: `turn/phases.ts` içinde bir `TurnPhase` yaz ve `TURN_PHASES` listesine doğru sıraya koy.
