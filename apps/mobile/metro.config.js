const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/**
 * Metro configuration for Audixa mobile app
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    // Map workspace packages
    extraNodeModules: {
      '@audixa/core': path.resolve(workspaceRoot, 'packages/core/src'),
      '@audixa/utils': path.resolve(workspaceRoot, 'packages/utils/src'),
      '@audixa/ui': path.resolve(workspaceRoot, 'packages/ui/src'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
