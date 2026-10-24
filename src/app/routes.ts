import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('./routes/home.tsx'),
  route('play', './routes/play.tsx'),
  route('*', './routes/not-found.tsx'),
] satisfies RouteConfig;
