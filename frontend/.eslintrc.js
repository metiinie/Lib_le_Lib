module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'warn',
    'no-console': 'warn', // Enforce convention: no console.log in commits
    'no-empty': 'error', // Enforce convention: no empty catch blocks
  },
};
