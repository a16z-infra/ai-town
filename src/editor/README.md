# Level Editor

## Setup

1. Run `npm run le` from the repository root and open the local URL printed by Vite, then choose
   **Level editer**. The port may change if another Vite server is running.
2. Import a map composite file (.js), such as `data/gentle.js`, into the level config input under
   the config tab
3. Customize your tileset by either:
   - Inputting it in the config tab
   - Modifying the `DEFAULTTILESETPATH` in leconfig.js (e.g. replace
     `export const DEFAULTTILESETPATH = "./tilesets/gentle.png"` with your tileset path)

## Map Editing Instructions

### Basic Controls

- Select tiles from the tileset in the top right pane (like selecting a paint brush)
- Click in the top left pane to place tiles on the background level (no collision)
- Click in the second row left pane to place tiles on the object level (with collision)

### Keyboard Shortcuts

- `f` - Fill level 0 with current tile
- `Ctrl+z` - Undo
- `g` - Overlay 32x32 grid
- `s` - Download `map.js`; see [Using the map in AI Town](#using-the-map-in-ai-town)
- `m` - Place semi-transparent red mask over tiles (helps find invisible tiles)
- `d` - Hold while clicking a tile to delete
- `p` - Toggle between 16pixel and 32 pixel

## Map Composite File Structure

After saving your map, you will receive a JavaScript export object similar to the following:

```js
export const tilesetpath = '/ai-town/assets/gentle-obj.png';
export const tiledim = 32;
export const screenxtiles = 45;
export const screenytiles = 32;
export const tilesetpxw = 1440;
export const tilesetpxh = 1024;

export const bgtiles = [
  // Layers containing tile columns, each containing tile rows (no collision)
];

export const objmap = [
  // Layers containing tile columns, each containing tile rows (with collision)
];

export const animatedsprites = [];
export const mapwidth = bgtiles[0].length;
export const mapheight = bgtiles[0][0].length;
```

Explanation of each property

- `tilesetpath`: Path to the tileset image that will be used as the “paint brushes” for your map.
- `tiledim`: The pixel dimension of each tile (e.g., 32px).
- `screenxtiles / screenytiles`: The tileset size in tile columns and rows, not the map size.
- `tilesetpxw / tilesetpxh`: The total pixel width and height of your tileset image (not the map).
- `bgtiles`: Background tiles (no collision), indexed as `[layer][x][y]`.
- `objmap`: Object tiles (with collision), indexed as `[layer][x][y]`. Each entry is a tile index.
- `animatedsprites`: Animated sprite definitions, or an empty array for a map without animations.
- `mapwidth / mapheight`: Map dimensions in tiles, matching the tile arrays.

## Using the map in AI Town

1. Save the downloaded JavaScript module under `data/`, for example `data/my-map.js`. Check that its
   `mapwidth` and `mapheight` match the `[layer][x][y]` tile arrays shown above.
2. Copy any new tileset image into `public/assets/` and set the module's `tilesetpath` to its public
   URL, for example `/ai-town/assets/my-tileset.png`. An editor-relative `./tilesets/...` path will
   not point to the same image in the game.
3. In `convex/init.ts`, replace the map import with your module:

```ts
import * as map from '../data/my-map';
```

Deploy the updated Convex code (for local development, keep `npm run dev:backend` running). Map data
is copied into the database when a world is created; changing the import and rerunning `init` does
not replace an existing world's map.

To create a new world using the updated map, run these commands from the repository root against the
intended deployment:

```bash
npx convex run testing:stop
npx convex run testing:archive
npx convex run init
```

This stops and archives the current world before creating a fresh one. The old world's records
remain in the database, but the new world starts with fresh agents and conversations. If no default
world exists yet, run only `npx convex run init`.

`testing:wipeAllTables` is a separate, destructive reset: it schedules deletion from **all tables
except `embeddingsCache`**, including worlds, players, messages, and memories. It does not just
clear the map table and is not required for the archive-and-initialize workflow above. If you
deliberately use it, wait for its scheduled deletions to finish before initializing again.
