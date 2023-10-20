//export const DEFAULTTILESETPATH = "./spritesheets/women.png";
//export const DEFAULTILEDIMX = 32; // px
//export const DEFAULTILEDIMY = 34; // px

//export const DEFAULTTILESETPATH = "./spritesheets/doll.png";
//export const DEFAULTILEDIMX = 48; // px
//export const DEFAULTILEDIMY = 48; // px

// export const DEFAULTTILESETPATH = "./spritesheets/peeps.png";
// export const DEFAULTILEDIMX = 48; // px
// export const DEFAULTILEDIMY = 96; // px

export const DEFAULTTILESETPATH = "./spritesheets/tall.png";
//export const DEFAULTTILESETPATH = "./spritesheets/Clothes_Hanging_1_32x32.png"
export const DEFAULTILEDIMX = 16; // px
export const DEFAULTILEDIMY = 16; // px

// export const DEFAULTTILESETPATH = "./spritesheets/wateranimate2.png";
// export const DEFAULTILEDIMX = 32; // px
// export const DEFAULTILEDIMY = 32; // px


// If there is padding between tilesets, set this to the pixel size
export const tilesetpadding = 0; 


// width / height of layer panes
export const levelwidth  = 2048; // px
export const levelheight = 1536; // px

export let leveltilewidth  = Math.floor(levelwidth / DEFAULTILEDIMX);
export let leveltileheight = Math.floor(levelheight / DEFAULTILEDIMX);

export const MAXTILEINDEX = leveltilewidth * leveltileheight;


// -- HTML

export const htmlLayerPaneW = 800;
export const htmlLayerPaneH = 600;

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
