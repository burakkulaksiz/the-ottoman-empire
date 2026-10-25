import { expose } from 'comlink';

import { createEngineApi } from './engine-api';

// Ağır hesaplar (ileride yapay zekâ) arayüzü dondurmasın diye motor burada çalışır.
expose(createEngineApi());
