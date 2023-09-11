//export const DEFAULTTILESETPATH = "./tree.jpg";
//export const DEFAULTTILESETPATH = "./dude.png";
//export const DEFAULTTILESETPATH = "./spiderman.png";
//export const DEFAULTTILESETPATH = "./girl.png";
export const DEFAULTTILESETPATH = "./peeps.png";
// export const DEFAULTTILESETPATH = "./strange.png";
//export const DEFAULTTILESETPATH = "./skeleton.png";
//export const DEFAULTTILESETPATH = "./link.png";
//export const DEFAULTTILESETPATH = "./ps-sprite.png";
//export const DEFAULTTILESETPATH = "./tall.png";
//export const DEFAULTTILESETPATH = "./spook.png";
//export const DEFAULTTILESETPATH = "./knuckles.png";

export const tilesetpadding = 0; 

export const DEFAULTILEDIMX = 32; // px
export const DEFAULTILEDIMY = 32; // px

export const levelwidth  = 1024; // px
export const levelheight = 768; // px

export let leveltilewidth  = Math.floor(levelwidth / DEFAULTILEDIMX);
export let leveltileheight = Math.floor(levelheight / DEFAULTILEDIMX);

export const MAXTILEINDEX = leveltilewidth * leveltileheight;


// -- HTML

export const htmlLayerPaneW = 800;
export const htmlLayerPaneH = 600;

export const htmlTilesetPaneW = 1600;
export const htmlTilesetPaneH = 1600;

export const htmlCompositePaneW = 800;
export const htmlCompositePaneH = 600;

// --  zIndex

// 1-10 taken by layers
export const zIndexFilter           =  20;
export const zIndexMouseShadow      =  30;
export const zIndexGrid             =  50;
export const zIndexCompositePointer =  100;