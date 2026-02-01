// lint-staged configuration
// Runs on staged files before commit
module.exports = {
  // TypeScript/JavaScript files
  '*.{ts,tsx,js,jsx,mjs}': ['eslint --fix', 'prettier --write'],

  // JSON files
  '*.json': ['prettier --write'],

  // CSS files
  '*.css': ['prettier --write'],

  // Type check on TypeScript changes
  '*.{ts,tsx}': () => 'tsc --noEmit',
}
