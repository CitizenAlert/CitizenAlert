const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for pnpm + Metro file watcher issues
config.watchFolders = [config.watchFolders[0]];
config.resolver.sourceExts.push('cjs');

module.exports = config;
