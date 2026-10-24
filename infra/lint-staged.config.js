export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix'],
  '*.{json,md,css,html}': ['prettier --write'],
  '*.{ts,tsx}': [() => 'npm run typecheck'],
};
