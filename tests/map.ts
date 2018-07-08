const maps = require('../src/constants/maps').default;

describe('map', () => {
  Object.keys(maps).map(mapInfoKey => {
    const map = require(`../assets/${maps[mapInfoKey].file}`);
    describe(mapInfoKey, () => {
      it('should have the proper layers', () => {
        const hasTerrain = map.layers.find(o => o.name === 'terrain');
        expect(hasTerrain).toBeDefined();
      });
    });
  });
});
