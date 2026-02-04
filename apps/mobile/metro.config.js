const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for pnpm + Metro file watcher issues
config.watchman.enabled = false;
config.watcher.usePolling = true;

module.exports = config;
