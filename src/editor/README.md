# Level Editor

## Setup

1. Run `npm run le` to start the level editor (localhost:5174)
2. Import a map composite file (.js) into the level config input under the config tab
3. Customize your tileset by either:
   - Inputting it in the config tab
   - Modifying the `DEFAULTTILESETPATH` in leconfig.js (e.g. replace `export const DEFAULTTILESETPATH = "./tilesets/gentle.png"` with your tileset path)

## Map Editing Instructions

### Basic Controls
- Select tiles from the tileset in the top right pane (like selecting a paint brush)
- Click in the top left pane to place tiles on the background level (no collision)
- Click in the second row left pane to place tiles on the object level (with collision)

### Keyboard Shortcuts
- `f` - Fill level 0 with current tile
- `Ctrl+z` - Undo
- `g` - Overlay 32x32 grid
- `s` - Generate .js file to move over to convex/maps/
- `m` - Place semi-transparent red mask over tiles (helps find invisible tiles)
- `d` - Hold while clicking a tile to delete
- `p` - Toggle between 16pixel and 32 pixel

## Map Composite File Structure

After saving your map, you will receive a JavaScript export object similar to the following:

```js
export const tilesetpath = "./tilesets/gentle-obj.png";
export const tiledim = 32;
export const screenxtiles = 45;
export const screenytiles = 32;
export const tilesetpxw = 1440;
export const tilesetpxh = 1024;

export const bgtiles = [
  // 2D array representing the background (no collision)
];

export const objmap = [
  // 2D array representing the object layer (with collision)
];
```

Explanation of each property
- `tilesetpath`: Path to the tileset image that will be used as the “paint brushes” for your map.
- `tiledim`: The pixel dimension of each tile (e.g., 32px).
- `screenxtiles / screenytiles`: The map size in terms of tile columns and rows (e.g., 45 tiles wide × 32 tiles tall).
- `tilesetpxw / tilesetpxh`: The total pixel width and height of your tileset image (not the map).
- `bgtiles`: A 2D array storing the background layer (no collision).
- `objmap`: A 2D array storing the object layer (with collision). Each entry is a number referencing the tile coordinate in your tileset.

To use the new map go to init.js and replace the map composite file path with the new one. and clear the map table in convex with 

```bash
just convex run testing:wipeAllTables
```

and then run to restart the world

```bash
just convex run init
```
