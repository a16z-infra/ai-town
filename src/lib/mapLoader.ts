/**
 * Map loader for AI Town static implementation
 * Loads world map data and converts it for PIXI rendering
 */

import { WorldMap } from './staticTypes';

export class MapLoader {
  private static mapData: WorldMap | null = null;

  static async loadWorldMap(): Promise<WorldMap> {
    if (this.mapData) {
      return this.mapData;
    }

    try {
      // Load the tilemap JSON data
      const response = await fetch('/assets/tilemap.json');
      if (!response.ok) {
        throw new Error(`Failed to load tilemap: ${response.statusText}`);
      }
      const tilemapData = await response.json();

      // Convert Tiled map format to AI Town WorldMap format
      const worldMap = this.convertTiledMapToWorldMap(tilemapData);
      this.mapData = worldMap;
      return worldMap;
    } catch (error) {
      console.error('Failed to load world map:', error);
      // Return a fallback simple map
      return this.createFallbackMap();
    }
  }

  private static convertTiledMapToWorldMap(tilemapData: any): WorldMap {
    const { width, height, tilewidth, tileheight, layers, tilesets } = tilemapData;
    
    // Extract tileset information
    const tileset = tilesets[0];
    const tileSetUrl = `/assets/${tileset.image}`;
    const tilesPerRow = Math.floor(tileset.imagewidth / tilewidth);
    
    // Convert layer data to tile arrays
    const bgTiles: number[][][] = [];
    const objectTiles: number[][][] = [];
    const decorTiles: number[][][] = [];
    
    layers.forEach((layer: any) => {
      const tileArray = this.convertLayerDataToTileArray(layer.data, width, height);
      
      if (layer.name.toLowerCase().includes('background') || layer.name.toLowerCase().includes('ground')) {
        bgTiles.push(tileArray);
      } else if (layer.name.toLowerCase().includes('object') || layer.name.toLowerCase().includes('building')) {
        objectTiles.push(tileArray);
      } else {
        decorTiles.push(tileArray);
      }
    });
    
    // Ensure we have at least one background layer
    if (bgTiles.length === 0 && layers.length > 0) {
      const firstLayer = layers[0];
      bgTiles.push(this.convertLayerDataToTileArray(firstLayer.data, width, height));
    }

    // Add animated sprites (campfire, waterfall, windmill, etc.)
    const animatedSprites = [
      {
        sheet: 'campfire.json',
        animation: 'campfire',
        x: 320,
        y: 200,
        w: 32,
        h: 32,
        startFrame: 0,
        endFrame: 3,
        period: 1000,
      },
      {
        sheet: 'gentlewaterfall.json', 
        animation: 'gentlewaterfall',
        x: 100,
        y: 100,
        w: 32,
        h: 32,
        startFrame: 0,
        endFrame: 3,
        period: 2000,
      },
      {
        sheet: 'windmill.json',
        animation: 'windmill',
        x: 450,
        y: 150,
        w: 32,
        h: 32,
        startFrame: 0,
        endFrame: 7,
        period: 3000,
      }
    ];

    return {
      bgTiles,
      objectTiles,
      decorTiles,
      width,
      height,
      tileSize: tilewidth,
      tilesheetUrl: tileSetUrl,
      tilesPerRow,
      animatedSprites,
      // PIXI-specific properties
      tileSetDimX: tileset.imagewidth,
      tileSetDimY: tileset.imageheight,
      tileDim: tilewidth,
      tileSetUrl,
    };
  }

  private static convertLayerDataToTileArray(data: number[], width: number, height: number): number[][] {
    const result: number[][] = [];
    
    for (let x = 0; x < width; x++) {
      result[x] = [];
      for (let y = 0; y < height; y++) {
        const index = y * width + x;
        // Convert from 1-based Tiled indices to 0-based, -1 for empty tiles
        const tileId = data[index];
        result[x][y] = tileId > 0 ? tileId - 1 : -1;
      }
    }
    
    return result;
  }

  private static createFallbackMap(): WorldMap {
    // Create a simple 20x20 grass map as fallback
    const width = 20;
    const height = 20;
    const bgLayer: number[][] = [];
    
    for (let x = 0; x < width; x++) {
      bgLayer[x] = [];
      for (let y = 0; y < height; y++) {
        // Use grass tiles (assuming tile index 0 is grass)
        bgLayer[x][y] = 0;
      }
    }

    return {
      bgTiles: [bgLayer],
      objectTiles: [[]],
      decorTiles: [[]],
      width,
      height,
      tileSize: 32,
      tilesheetUrl: '/assets/rpg-tileset.png',
      tilesPerRow: 16,
      animatedSprites: [],
      tileSetDimX: 512,
      tileSetDimY: 512,
      tileDim: 32,
      tileSetUrl: '/assets/rpg-tileset.png',
    };
  }

  static clearCache() {
    this.mapData = null;
  }
}