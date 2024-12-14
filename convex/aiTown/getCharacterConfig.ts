import { ServerGame } from '../../src/hooks/serverGame';
import { parseGameId } from './ids';

export type CharacterConfig = {
  name: string;
  textureUrl: string;
  spritesheetData: {
    frames: {
      [key: string]: {
        frame: { x: number; y: number; w: number; h: number };
        sourceSize: { w: number; h: number };
        spriteSourceSize: { x: number; y: number };
      };
    };
    meta: { scale: string };
    animations: {
      [key: string]: string[];
    };
  };
  speed?: number;
};

export function getCharacterConfig(game: ServerGame, characterId: string): CharacterConfig | null {
  // Handle dynamic character IDs
  const dynamicCharacterId = characterId.startsWith('dynamic_p:')
    ? characterId
    : `dynamic_p:${characterId.split(':')[1]}`;

  console.log('Looking up character:', {
    characterId,
    dynamicCharacterId,
    hasConfig: game.characterConfigs?.has(dynamicCharacterId),
    availableConfigs: Array.from(game.characterConfigs?.keys() ?? []),
    playerDescriptions: Array.from(game.playerDescriptions.entries()).map(([id, desc]) => ({
      playerId: id,
      character: desc.character,
      textureUrl: desc.textureUrl,
    })),
  });

  // Check game state for character config
  if (game.characterConfigs?.has(dynamicCharacterId)) {
    return game.characterConfigs.get(dynamicCharacterId)!;
  }

  // Find player description by character ID
  const playerDesc = Array.from(game.playerDescriptions.values()).find(
    (desc) => desc.character === characterId || desc.character === dynamicCharacterId,
  );

  if (!playerDesc?.textureUrl) {
    console.error(`No texture URL found for character ${characterId}`);
    return null;
  }

  // Generate character config
  const config: CharacterConfig = {
    name: dynamicCharacterId,
    textureUrl: playerDesc.textureUrl,
    spritesheetData: {
      frames: {
        left: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        left2: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        left3: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        right: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        right2: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        right3: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        up: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        up2: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        up3: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        down: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        down2: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
        down3: {
          frame: { x: 0, y: 0, w: 32, h: 32 },
          sourceSize: { w: 32, h: 32 },
          spriteSourceSize: { x: 0, y: 0 },
        },
      },
      meta: { scale: '1' },
      animations: {
        left: ['left', 'left2', 'left3'],
        right: ['right', 'right2', 'right3'],
        up: ['up', 'up2', 'up3'],
        down: ['down', 'down2', 'down3'],
      },
    },
    speed: 0.1,
  };

  // Store for in-memory use
  game.characterConfigs = game.characterConfigs || new Map();
  game.characterConfigs.set(dynamicCharacterId, config);

  // Mark descriptions as modified so the Game class will persist to DB
  game.descriptionsModified = true;

  return config;
}
