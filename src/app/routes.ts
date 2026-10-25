import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('./routes/home.tsx'),
  route('scenarios', './routes/scenarios.tsx'),
  route('saves', './routes/saves.tsx'),
  route('play/:scenarioId', './routes/play.tsx'),
  route('*', './routes/not-found.tsx'),
] satisfies RouteConfig;
