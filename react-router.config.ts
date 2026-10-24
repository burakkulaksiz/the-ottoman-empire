import type { Config } from '@react-router/dev/config';

export default {
  // Oyun şimdilik tamamen tarayıcıda çalışıyor (SPA modu).
  // İleride backend eklendiğinde `ssr: true` yapılabilir.
  ssr: false,
  appDirectory: 'src/app',
} satisfies Config;
