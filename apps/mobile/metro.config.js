const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getSentryExpoConfig(projectRoot);

config.watchFolders = [
  ...(config.watchFolders || []),
  workspaceRoot,
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.sourceExts.push('cjs');

module.exports = config;
