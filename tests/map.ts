const maps = require('../src/constants/maps').default;
const scenes = require('../src/constants/scenes').default;
const sceneNames = Object.values(scenes);

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
      });

      describe('zones', () => {
        it('should have a propery "scene" that points to an existing scene', () => {
          const zonesLayer = map.layers.find(o => o.name === 'zones');
          zonesLayer.objects.map(zone => {
            const destination = zone.properties.scene;
            const isDestinationInScenes = sceneNames.includes(destination);
            expect(isDestinationInScenes).toEqual(true);
          });
        });
      });
    });
  });
});
