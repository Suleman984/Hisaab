const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Force Babel transformation for packages that use import.meta (ESM-only syntax)
// so babel-preset-expo's unstable_transformImportMeta plugin can rewrite them.
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|expo|@expo|react-devtools-core|terser|sucrase|acorn|@babel/parser)/)',
];

module.exports = config;
