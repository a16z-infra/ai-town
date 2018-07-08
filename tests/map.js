const firstMap = require('../assets/tilemap.json');

describe('map', () => {
  describe('firstMap', () => {
    it('should have the proper layers', () => {
      const hasTerrain = firstMap.layers.find(o => o.name === 'terrain');
      expect(hasTerrain).toBeDefined();
    });
  });
});
