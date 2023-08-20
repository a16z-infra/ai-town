import * as PIXI from 'pixi.js'
import { EventSystem } from '@pixi/events';

// --
// Globals
// --

let tile_index = 0; // selected index from tileset

let numxtiles = 21; 
let numytiles = 7; 
let tileDim = 32;
let dimlog = Math.log2(tileDim); 

const tilesetfile = "./simple.png";
const tilefilew = 672;
const tilefileh = 224;

// const tilesetfile = "./pipo.png";
// const tilefilew = 256;
// const tilefileh = 4256;

const levelwidth  = 1600;
const levelheight = 1600;

// First layer of level
const level_app0 = new PIXI.Application( {backgroundColor: 0x2980b9, width : levelwidth, height : levelheight, view: document.getElementById('level0')});

// second layer of level 
const level_app1 = new PIXI.Application( {backgroundColor: 0x2980b9, width : levelwidth, height : levelheight, view: document.getElementById('level1')});

//  object layer of level
const level_app2    = new PIXI.Application( {backgroundColor: 0x2980b9, width : levelwidth, height : levelheight, view: document.getElementById('level3')});

// composite view 
const composite_app = new PIXI.Application( {backgroundColor: 0x2980b9, width : levelwidth, height : levelheight, view: document.getElementById('composite')});

// tileset
const tileset_app = new PIXI.Application( {width :tilefilew, height : tilefileh, view: document.getElementById('tileset')});


const tiles64 = []; 
const tiles32 = []; 
const tiles16 = []; 

let curtiles = tiles32;

let indexswitch = false;

window.toggleindex = () => {
    indexswitch = !indexswitch;
    console.log("toggle ",indexswitch);
 }

window.setGridDim = (val) => {
    console.log("setGridDim ",val);
    if(val == 16){
        if(tileDim == 16) {return;}
        numxtiles /= (val/tileDim);
        numytiles /= (val/tileDim);
        tileDim = 16; 
        dimlog = Math.log2(tileDim); 
        curtiles = tiles16;
        console.log("set to curTiles16");
    }else if (val == 32){
        if(tileDim == 32) {return;}
        numxtiles /= (val/tileDim);
        numytiles /= (val/tileDim);
        tileDim = 32; 
        dimlog = Math.log2(tileDim); 
        curtiles = tiles32;
        console.log("set to curTiles32");
    }else if (val == 64){
        if(tileDim == 64) {return;}
        numxtiles /= (val/tileDim);
        numytiles /= (val/tileDim);
        tileDim = 64; 
        dimlog = Math.log2(tileDim); 
        curtiles = tiles64;
        console.log("set to curTiles64");
    }else{
        console.debug("Invalid TileDim!");
    }
 }


const level0_container = new PIXI.Container();
const level1_container = new PIXI.Container();
const level2_container = new PIXI.Container();

const composite_container = new PIXI.Container();

// load tileset into a global array of textures for blitting onto levels
const bt = PIXI.BaseTexture.from(tilesetfile, {
    scaleMode: PIXI.SCALE_MODES.NEAREST,
  });
for (let x = 0; x < numxtiles; x++) {
  for (let y = 0; y < numytiles; y++) {
    tiles32[x + y * numxtiles] = new PIXI.Texture(
      bt,
      new PIXI.Rectangle(x * 32, y * 32, 32, 32),
    );
  }
}
for (let x = 0; x < numxtiles*2; x++) {
  for (let y = 0; y < numytiles*2; y++) {
    tiles16[x + y * numxtiles*2] = new PIXI.Texture(
      bt,
      new PIXI.Rectangle(x * 16, y * 16, 16, 16),
    );
  }
}
for (let x = 0; x < numxtiles/2; x++) {
  for (let y = 0; y < numytiles/2; y++) {
    if((x*64)+64 > tilefilew || (y*64)+64 > tilefileh ){
        console.debug("64 bit tile overrun, ignoring");
        continue;
    }
    tiles64[x + y * numxtiles/2] = new PIXI.Texture(
      bt,
      new PIXI.Rectangle(x * 64, y * 64, 64, 64),
    );
  }
}

var square0 = new PIXI.Graphics();
square0.beginFill(0x2980b9);
square0.drawRect(0, 0, 1600, 1600);
square0.endFill();
square0.interactive = true;
level0_container.addChild(square0);

var square1 = new PIXI.Graphics();
square1.beginFill(0x2980b9);
square1.drawRect(0, 0, 1600, 1600);
square1.endFill();
square1.interactive = true;
level1_container.addChild(square1);

var square2 = new PIXI.Graphics();
square2.beginFill(0x2980b9);
square2.drawRect(0, 0, 1600, 1600);
square2.endFill();
square2.interactive = true;
level2_container.addChild(square2);

var level0_sprites = {};
square0.on('mousedown', function (e) {
    console.log('Mouse clicked');
    console.log('X', e.data.global.x, 'Y', e.data.global.y);
    let xPx = e.data.global.x;
    let yPx = e.data.global.y;
    const ctile = new PIXI.Sprite(curtiles[tile_index]);
    const ctile2 = new PIXI.Sprite(curtiles[tile_index]);
    ctile.x = (xPx >> dimlog) << dimlog; // snap to 32
    ctile2.x = (xPx >> dimlog) << dimlog; // snap to 32
    ctile.y = (yPx>>dimlog) << dimlog;
    ctile2.y = (yPx>>dimlog) << dimlog;

    console.log('ctile.x ', ctile.x, 'ctile.y ', ctile.y);
    let new_index = ctile.x + (ctile.y*numxtiles*tileDim);
    console.log('New index',new_index);

    if(level0_sprites.hasOwnProperty(new_index)){
        console.log("REMOVING!");
        level0_container.removeChild(level0_sprites[new_index]);
        composite_container.removeChild(level0_sprites[new_index]);
    }
    level0_container.addChild(ctile);
    composite_container.addChild(ctile2);
    level0_sprites[new_index] = ctile;
  });

var level1_sprites = {};
square1.on('mousedown', function (e) {
    console.log('Mouse clicked');
    console.log('X', e.data.global.x, 'Y', e.data.global.y);
    let xPx = e.data.global.x;
    let yPx = e.data.global.y;
    const ctile  = new PIXI.Sprite(curtiles[tile_index]);
    const ctile2 = new PIXI.Sprite(curtiles[tile_index]);
    ctile.x = (xPx >> dimlog) << dimlog; // snap to 32
    ctile.y = (yPx>>dimlog) << dimlog;
    ctile2.x = (xPx >> dimlog) << dimlog; // snap to 32
    ctile2.y = (yPx>>dimlog) << dimlog;
    let new_index = ctile.x + (ctile.y*numxtiles*tileDim);

    if(level1_sprites.hasOwnProperty(new_index)){
        console.log("REMOVING!");
        level1_container.removeChild(level1_sprites[new_index]);
        composite_container.removeChild(level1_sprites[new_index]);
    }
    level1_container.addChild(ctile);
    composite_container.addChild(ctile2);
    level1_sprites[new_index] = ctile;
  });

var level2_sprites = {};
square2.on('mousedown', function (e) {
    console.log('Mouse clicked');
    console.log('X', e.data.global.x, 'Y', e.data.global.y);
    let xPx = e.data.global.x;
    let yPx = e.data.global.y;
    const ctile  = new PIXI.Sprite(curtiles[tile_index]);
    const ctile2 = new PIXI.Sprite(curtiles[tile_index]);
    ctile.x = (xPx >> dimlog) << dimlog; // snap to 32
    ctile.y = (yPx>>dimlog) << dimlog;
    ctile2.x = (xPx >> dimlog) << dimlog; // snap to 32
    ctile2.y = (yPx>>dimlog) << dimlog;
    let new_index = ctile.x + (ctile.y*numxtiles);

    if(level2_sprites.hasOwnProperty(new_index)){
        console.log("REMOVING!");
        level2_container.removeChild(level1_sprites[new_index]);
        composite_container.removeChild(level1_sprites[new_index]);
    }
    level2_container.addChild(ctile);
    composite_container.addChild(ctile2);
    level2_sprites[new_index] = ctile;
  });

const tilesetcontainer = new PIXI.Container();
const texture = PIXI.Texture.from(tilesetfile);
const bg = new PIXI.Sprite(texture);

var tilesetsq = new PIXI.Graphics();
tilesetsq.drawRect(0, 0, 1600, 1600);
tilesetsq.beginFill(0x2980b9);
tilesetsq.drawRect(0, 0, 1600, 1600);
tilesetsq.interactive = true;
tilesetcontainer.addChild(tilesetsq);
tilesetcontainer.addChild(bg);

tilesetsq.on('mousedown', function (e) {
    console.log('Mouse clicked');

    let tilex = Math.floor(e.data.global.x / tileDim);
    let tiley = Math.floor(e.data.global.y / tileDim);

    tile_index = (tiley * numxtiles) + tilex;

    console.log('X', tilex, 'Y', tiley, 'index:  ',tile_index);
});

level_app0.stage.addChild(level0_container);
level_app1.stage.addChild(level1_container);
level_app2.stage.addChild(level2_container);

composite_app.stage.addChild(composite_container);
tileset_app.stage.addChild(tilesetcontainer);

const graphics = new PIXI.Graphics();

let gridsize = tileDim;

graphics.lineStyle(1, 0xffffff, 1);
let index = 0;
for (let i = 0; i < 1600; i+=gridsize) {
    graphics.moveTo(i, 0);
    graphics.lineTo(i, 1600);
    graphics.moveTo(i+gridsize, 0);
    graphics.lineTo(i+gridsize, 1600);

    graphics.moveTo(0, i);
    graphics.lineTo(1600, i);
    graphics.moveTo(0, i+gridsize);
    graphics.lineTo(1600, i+gridsize);

    tilesetcontainer.addChild(graphics);
    level0_container.addChild(graphics.clone());
    level1_container.addChild(graphics.clone());
    level2_container.addChild(graphics.clone());

    // Slows things down so commenting out for now

    if (indexswitch) {
        let style = { fontFamily: 'Arial', fontSize: 10, fill: 0xffffff, align: 'center', };
        for (let j = 0; j < 1600; j += gridsize) {
            const itxt2 = new PIXI.Text('' + index, style);
            const itxt3 = new PIXI.Text('' + index, style);

            itxt2.x = j; itxt3.x = j;
            itxt2.y = i; itxt3.y = i;
            level0_container.addChild(itxt2);
            level1_container.addChild(itxt3);
            index++;
        }
    }
}
