module.exports = {
  babel: {
    plugins: [
      // Remove console statements in production builds only
      process.env.NODE_ENV === 'production'
        ? ['transform-remove-console', { exclude: ['error', 'warn'] }]
        : null,
    ].filter(Boolean),
  },
};

