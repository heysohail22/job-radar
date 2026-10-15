const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, "svg"])];
// Avoid multiple Metro workers competing with Gradle on this 7 GB machine.
config.maxWorkers = 1;
module.exports = config;
