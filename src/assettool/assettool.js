import * as PIXI from 'pixi.js'
import { EventSystem } from '@pixi/events';

// --
// Globals
// --

let tile_index = 0; // selected index from tileset
let selected_tiles = [];

const tilesetfile = "./magecity.png";
const tilefilew = 256;
const tilefileh = 1450;

let num32xtiles = tilefilew/32; 
let num32ytiles = 44; // FIXME get around bad filelength in magecity
// let num32ytiles = tilefileh/32; 
let tileDim = 32;
let dimlog = Math.log2(tileDim); 


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

const tiles32 = []; 
const tiles16 = []; 

let curtiles = tiles32;

let indexswitch = false;

window.toggleindex = () => {
    indexswitch = !indexswitch;
    console.log("toggle ",indexswitch);
 }

// fill base level with 32x32 tiles of current index
window.fill0 = () => {
    for(let i = 0; i < levelwidth / 32; i++){
        for(let j = 0; j < levelheight / 32; j++){
            addTileLevel0Coords(i,j,32, tile_index);
        }
    }
}

// Size of tiles we're working with
window.setGridDim = (val) => {
    console.log("setGridDim ",val);
    if(val == 16){
        if(tileDim == 16) {return;}
        num32xtiles /= (val/tileDim);
        num32ytiles /= (val/tileDim);
        tileDim = 16; 
        dimlog = Math.log2(tileDim); 
        curtiles = tiles16;
        console.log("set to curTiles16");
    }else if (val == 32){
        if(tileDim == 32) {return;}
        num32xtiles /= (val/tileDim);
        num32ytiles /= (val/tileDim);
        tileDim = 32; 
        dimlog = Math.log2(tileDim); 
        curtiles = tiles32;
        console.log("set to curTiles32");
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
for (let x = 0; x < num32xtiles; x++) {
  for (let y = 0; y < num32ytiles; y++) {
    tiles32[x + y * num32xtiles] = new PIXI.Texture(
      bt,
      new PIXI.Rectangle(x * 32, y * 32, 32, 32),
    );
  }
}
for (let x = 0; x < num32xtiles*2; x++) {
  for (let y = 0; y < num32ytiles*2; y++) {
    tiles16[x + y * num32xtiles*2] = new PIXI.Texture(
      bt,
      new PIXI.Rectangle(x * 16, y * 16, 16, 16),
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

function addTileLevel0Coords(x, y, dim, index) {
    //addTileLevel0Px(x*dim, y*dim, index);
    addTileLevelPx(x*dim, y*dim, index, level0_container, level0_sprites);
}
function addTileLevel1Coords(x, y, dim, index) {
    addTileLevelPx(x*dim, y*dim, index, level1_container, level1_sprites);
}

function addTileLevel2Coords(x, y, dim, index) {
    addTileLevelPx(x*dim, y*dim, index, level2_container, level2_sprites);
}

function addTileLevelPx(x, y, index, levelcontainer, sprites) {
    let xPx = x;
    let yPx = y;

    const ctile = new PIXI.Sprite(curtiles[index]);  // level map
    const ctile2 = new PIXI.Sprite(curtiles[index]); // composite map

    // snap to grid
    ctile.x = (xPx >> dimlog) << dimlog; 
    ctile2.x = (xPx >> dimlog) << dimlog; 
    ctile.y = (yPx>>dimlog) << dimlog;
    ctile2.y = (yPx>>dimlog) << dimlog;

    // console.log('ctile.x ', ctile.x, 'ctile.y ', ctile.y);
    let new_index = ctile.x + (ctile.y*num32xtiles*tileDim);
    // console.log('Level0 index',new_index);

    if(sprites.hasOwnProperty(new_index)){
        console.log("level: removing old tile",new_index);
        levelcontainer.removeChild(sprites[new_index]);
        composite_container.removeChild(sprites[new_index]);
    }
    levelcontainer.addChild(ctile);
    composite_container.addChild(ctile2);
    sprites[new_index] = ctile;
}

var level0_sprites = {};
square0.on('mousedown', function (e) {
    console.log('Level 0: X', e.data.global.x, 'Y', e.data.global.y);

    let xorig = e.data.global.x;
    let yorig = e.data.global.y;

    if (selected_tiles.length == 0) {
        addTileLevelPx(e.data.global.x, e.data.global.y, tile_index, level0_container, level0_sprites);
    } else {
        for (index of selected_tiles) {
            addTileLevelPx(xorig + index[0] * tileDim, yorig + index[1] * tileDim, index[2], level0_container, level0_sprites);
        }
    }
  });

var level1_sprites = {};
square1.on('mousedown', function (e) {
    console.log('Level 1: X', e.data.global.x, 'Y', e.data.global.y);

    let xorig = e.data.global.x;
    let yorig = e.data.global.y;

    if (selected_tiles.length == 0) {
        addTileLevelPx(e.data.global.x, e.data.global.y, tile_index, level1_container, level1_sprites);
    } else {
        for (index of selected_tiles) {
            addTileLevelPx(xorig + index[0] * tileDim, yorig + index[1] * tileDim, index[2], level1_container, level1_sprites);
        }
    }
  });

var level2_sprites = {};
square2.on('mousedown', function (e) {
    console.log('Level 2: X', e.data.global.x, 'Y', e.data.global.y);

    let xorig = e.data.global.x;
    let yorig = e.data.global.y;

    if (selected_tiles.length == 0) {
        addTileLevelPx(e.data.global.x, e.data.global.y, tile_index, level2_container, level2_sprites);
    } else {
        for (index of selected_tiles) {
            addTileLevelPx(xorig + index[0] * tileDim, yorig + index[1] * tileDim, index[2], level2_container, level2_sprites);
        }
    }
  });

const tilesetcontainer = new PIXI.Container();
const texture = PIXI.Texture.from(tilesetfile);
const bg = new PIXI.Sprite(texture);

var tilesetsq = new PIXI.Graphics();
tilesetsq.drawRect(0, 0, tilefilew, tilefileh);
tilesetsq.beginFill(0x2980b9);
tilesetsq.drawRect(0, 0, tilefilew, tilefileh);
tilesetsq.interactive = true;
tilesetcontainer.addChild(tilesetsq);
tilesetcontainer.addChild(bg);

tilesetsq.on('mousedown', function (e) {
    console.log('Mouse clicked');

    let tilex = Math.floor(e.data.global.x / tileDim);
    let tiley = Math.floor(e.data.global.y / tileDim);

    tile_index = (tiley * num32xtiles) + tilex;

    console.log('X', tilex, 'Y', tiley, 'index:  ',tile_index);
});

tilesetsq.on('pointerdown', onDragStart)
         .on('pointerup', onDragEnd)
         .on('pointerupoutside', onDragEnd);

var dragsquare = new PIXI.Graphics();
let startx = 0;
let starty = 0;
let endx   = 0;
let endy   = 0;

// Listen to pointermove on stage once handle is pressed.
function onDragStart(e)
{
    console.log("onDragStart()");
    tileset_app.stage.eventMode = 'static';
    tileset_app.stage.addEventListener('pointermove', onDrag);
    
    startx = e.data.global.x;
    starty = e.data.global.y;
    tileset_app.stage.addChild(dragsquare);

    selected_tiles = [];
}

// Stop dragging feedback once the handle is released.
function onDragEnd(e)
{
    console.log("onDragEnd()");
    tileset_app.stage.eventMode = 'auto';
    tileset_app.stage.removeEventListener('pointermove', onDrag);
    tileset_app.stage.removeChild(dragsquare);

    let starttilex = Math.floor(startx / tileDim);
    let starttiley = Math.floor(starty / tileDim);
    let endtilex = Math.floor(endx / tileDim);
    let endtiley = Math.floor(endy / tileDim);
    console.log("sx sy ex ey ",starttilex,",",starttiley,",",endtilex,",",endtiley);

    tile_index = (starttiley * num32xtiles) + starttilex;

    let origx = starttilex;
    let origy = starttiley;
    for(let i = starttilex; i <= endtilex; i++){
        for(let j = starttiley; j <= endtiley; j++){
            let squareindex = (j * num32xtiles) + i;
            console.log("i,j ",i,",",j);
            console.log("index ",squareindex);
            selected_tiles.push([i - origx,j - origy,squareindex]);
        }
    }
    dragsquare.clear();
}

function onDrag(e)
{
    endx = e.data.global.x;
    endy = e.data.global.y;
    
    dragsquare.clear();
    dragsquare.beginFill(0xFF3300, 0.3);
    dragsquare.lineStyle(2, 0xffd900, 1);
    dragsquare.moveTo(startx, starty);
    dragsquare.lineTo(endx, starty);
    dragsquare.lineTo(endx, endy);
    dragsquare.lineTo(startx, endy);
    dragsquare.closePath();
    dragsquare.endFill();
}



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
