const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Fix for pnpm + Metro file watcher issues
config.watchFolders = [config.watchFolders[0]];
config.resolver.sourceExts.push('cjs');

module.exports = config;