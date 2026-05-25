const { getDefaultConfig } = require('expo/metro-config');

// SDK 56+: expo/metro-config auto-configures monorepo settings.
// Manual watchFolders, nodeModulesPaths, and disableHierarchicalLookup
// are not needed and cause expo-doctor failures.
const config = getDefaultConfig(__dirname);

module.exports = config;
