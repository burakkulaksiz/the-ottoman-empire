import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('./routes/home.tsx'),
  route('scenarios', './routes/scenarios.tsx'),
  route('saves', './routes/saves.tsx'),
  route('encyclopedia', './routes/encyclopedia.tsx'),
  route('encyclopedia/:entryId', './routes/encyclopedia-entry.tsx'),
  route('sources', './routes/sources.tsx'),
  route('achievements', './routes/achievements.tsx'),
  route('play/:scenarioId', './routes/play.tsx'),
  route('*', './routes/not-found.tsx'),
] satisfies RouteConfig;
