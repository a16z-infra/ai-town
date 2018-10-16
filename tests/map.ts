const maps = require('../src/constants/maps').MAPS;
const scenes = require('../src/constants/scenes').SCENES;
const monsters = require('../src/constants/monsters').MONSTERS;
const sceneNames = Object.values(scenes);

const MANDATORY_LAYERS = ['terrain', 'deco', 'bridge', 'monsters', 'npcs', 'zones'];
const COMES_BACK_FROM_ENUM = ['up', 'down', 'left', 'right'];

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
        it('should have a propery "comesBackFrom" that is an enum', () => {
          const zonesLayer = map.layers.find(o => o.name === 'zones');
          zonesLayer.objects.map(zone => {
            const comesBackFrom = zone.properties.comesBackFrom;
            const isComesBackFromInEnum = COMES_BACK_FROM_ENUM.includes(comesBackFrom);
            expect(isComesBackFromInEnum).toEqual(true);
          });
        });
      });

      describe('npcs', () => {
        it('should have a propery "message"', () => {
          const npcsLayer = map.layers.find(o => o.name === 'npcs');
          npcsLayer.objects.map(npc => {
            const npcMessage = npc.properties.message;
            expect(npcMessage).toBeDefined();
          });
        });
      });

      describe('monsters', () => {
        it('should have only monsters declared in the constants', () => {
          const monstersLayer = map.layers.find(o => o.name === 'monsters');
          monstersLayer.objects.map(monster => {
            const monsterName = monster.name;
            expect(Object.values(monsters)).toContain(monsterName);
          });
        });
      });

    });
  });
});
