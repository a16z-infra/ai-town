// TODO
// CONFIG should only have 
// defaulttilesetpath
// defaultlevelwidthpx
// defaultlevelheightpx
// HTTML defaults
// the rest should be calculated at runtime and put into g_context

//export const tilesetpath = "./avalon.png";
//export const tilefilew = 672; // px
//export const tilefileh = 544; // px 

// export const tilesetpath = "./phantasy2.png";
// export const tilefilew = 288; // px
// export const tilefileh = 384; // px 
// export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

// export const tilesetpath = "./ps2-town-tiles.png";
// export const tilefilew = 270; // px
// export const tilefileh = 406; // px 
// export const tilesetpadding = 2; // some tilesets put spaces between tiles (annoying)

export const DEFAULTTILESETPATH = "./ps1.png";
export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

//export const tilesetpath = "./phantasystar.png";
//export const tilefilew = 1664; // px
//export const tilefileh = 1280; // px 
//export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

//export const tilesetpath = "./terrain_atlas.png";
//export const tilefilew = 1024; // px
//export const tilefileh = 1024; // px 

// export const tilesetpath = "./rpg-tileset.png";
// export const tilefilew = 1600; // px
// export const tilefileh = 1600; // px 

// export const tilesetpath = "./composite.png";
// export const tilefilew = 640; // px
// export const tilefileh = 320; // px 

// export const tilesetpath = "./magecity.png";
// export const tilefilew = 256; // px
// export const tilefileh = 1408; // px 

//export const tilesetpath = "./pipo.png";
//export const tilefilew = 256;
//export const tilefileh = 4256;

export const DEFAULTILEDIM = 32; // px

export const levelwidth  = 1152; // px
export const levelheight = 768; // px

export let leveltilewidth  = levelwidth / DEFAULTILEDIM;
export let leveltileheight = levelheight / DEFAULTILEDIM;

export const MAXTILEINDEX = leveltilewidth * leveltileheight;

// FIXME
// export let tilesettilewidth  = Math.floor(tilefilew/(DEFAULTILEDIM + tilesetpadding)); 
// export let tilesettileheight = Math.floor(tilefileh/(DEFAULTILEDIM + tilesetpadding)); 

// export function settilesettilewidth(val) {
//     tilesettilewidth =  val;
// }
// export function settilesettileheight(val) {
//     tilesettileheight = val;
// }

// -- HTML

export const htmlLayerPaneW = 640;
export const htmlLayerPaneH = 480;

export const htmlCompositePaneW = 640;
export const htmlCompositePaneH = 480;

// --  zIndex

// 1-10 taken by layers
export const zIndexFilter           =  20;
export const zIndexMouseShadow      =  30;
export const zIndexGrid             =  50;
export const zIndexCompositePointer =  100;