const maps = require('../src/constants/maps').default;

const MANDATORY_LAYERS = ['terrain', 'deco', 'bridge', 'treants', 'npcs', 'zones'];

describe('map', () => {
  Object.keys(maps).map(mapInfoKey => {
    const map = require(`../assets/${maps[mapInfoKey].file}`);
    describe(mapInfoKey, () => {
      MANDATORY_LAYERS.map(layerName => {
        it(`should have the ${layerName} layer`, () => {
          const hasTerrain = map.layers.find(o => o.name === layerName);
          expect(hasTerrain).toBeDefined();
        });
      })
    });
  });
});
