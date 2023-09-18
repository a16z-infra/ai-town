//export const DEFAULTTILESETPATH = "./Serene.png";
//export const DEFAULTTILESETPATH = "./tilesets/Modern.png";
export const DEFAULTTILESETPATH = "./tilesets/forest.png";
export const tilesetpadding = 0; 

//export const DEFAULTTILESETPATH = "./avalon.png";
//export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

// export const DEFAULTTILESETPATH = "./phantasy2.png";
// export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

// export const DEFAULTTILESETPATH = "./ps2-town-tiles.png";
// export const tilesetpadding = 2; // some tilesets put spaces between tiles (annoying)

// export const DEFAULTTILESETPATH = "./ps1.png";
// export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

//export const DEFAULTTILESETPATH = "./phantasystar.png";
//export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

//export const DEFAULTTILESETPATH = "./terrain_atlas.png";
//export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

// export const DEFAULTTILESETPATH = "./rpg-tileset.png";
//export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

// export const DEFAULTTILESETPATH = "./composite.png";
//export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

//export const DEFAULTTILESETPATH = "./mana.png";

//export const DEFAULTTILESETPATH = "./tree.jpg";
//export const DEFAULTTILESETPATH = "./dude.png";
//export const DEFAULTTILESETPATH = "./spiderman.png";
//export const DEFAULTTILESETPATH = "./girl.png";
//export const DEFAULTTILESETPATH = "./peeps.png";
// export const DEFAULTTILESETPATH = "./strange.png";
//export const DEFAULTTILESETPATH = "./skeleton.png";
//export const DEFAULTTILESETPATH = "./link.png";
//export const DEFAULTTILESETPATH = "./ps-sprite.png";
//export const DEFAULTTILESETPATH = "./tall.png";
//export const DEFAULTTILESETPATH = "./spook.png";
//export const DEFAULTTILESETPATH = "./knuckles.png";
//export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

//export const DEFAULTTILESETPATH = "./forest.png";
//export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

//export const DEFAULTTILESETPATH = "./magecity.png";
//export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

//export const DEFAULTTILESETPATH = "./pipo.png";
//export const tilesetpadding = 0; // some tilesets put spaces between tiles (annoying)

export const DEFAULTILEDIMX = 32; // px
export const DEFAULTILEDIMY = 32; // px

export const levelwidth  = 2048; // px
export const levelheight = 1536; // px

export let leveltilewidth  = Math.floor(levelwidth / DEFAULTILEDIMX);
export let leveltileheight = Math.floor(levelheight / DEFAULTILEDIMX);

export const MAXTILEINDEX = leveltilewidth * leveltileheight;


// -- HTML

export const htmlLayerPaneW = 800;
export const htmlLayerPaneH = 600

export const htmlTilesetPaneW = 800;
export const htmlTilesetPaneH = 600;

export const htmlCompositePaneW = 800;
export const htmlCompositePaneH = 600;

// --  zIndex

// 1-10 taken by layers
export const zIndexFilter           =  20;
export const zIndexMouseShadow      =  30;
export const zIndexGrid             =  50;
export const zIndexCompositePointer =  100;
