const {
  buildDependencyCruiserConfig,
  loadModuleBoundariesManifest,
} = require('./scripts/module-boundaries-manifest.cjs');

module.exports = buildDependencyCruiserConfig(loadModuleBoundariesManifest());
