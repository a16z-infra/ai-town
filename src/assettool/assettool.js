import * as PIXI from 'pixi.js'
import { g_context }  from './context.js' // global context
import * as CONFIG from './levelconfig.js' 
import * as INTER from './interactive.js'
import { EventSystem } from '@pixi/events';

// First layer of level
const level_app0 = new PIXI.Application( {backgroundColor: 0x2980b9, width : CONFIG.LEVELWIDTH, height : CONFIG.LEVELHEIGHT, view: document.getElementById('level0')});
// second layer of level 
const level_app1 = new PIXI.Application( {backgroundColor: 0x2980b9, width : CONFIG.LEVELWIDTH, height : CONFIG.LEVELHEIGHT, view: document.getElementById('level1')});
//  object layer of level
const level_app2    = new PIXI.Application( {backgroundColor: 0x2980b9, width : CONFIG.LEVELWIDTH, height : CONFIG.LEVELHEIGHT, view: document.getElementById('level3')});
// composite view 
const composite_app = new PIXI.Application( {backgroundColor: 0x2980b9, width : CONFIG.LEVELWIDTH, height : CONFIG.LEVELHEIGHT, view: document.getElementById('composite')});
// tileset
const tileset_app = new PIXI.Application( {width :CONFIG.TILEFILEW, height : CONFIG.TILEFILEH, view: document.getElementById('tileset')});
const { renderer } = tileset_app;

// Install the EventSystem
renderer.addSystem(EventSystem, 'tileevents');

const tiles32 = []; 
const tiles16 = []; 
let placed_cache = [];

let curtiles = tiles32;

let indexswitch = false;

window.toggleindex = () => {
    indexswitch = !indexswitch;
    console.log("toggle ",indexswitch);
 }

// fill base level with 32x32 tiles of current index
window.fill0 = () => {
    for(let i = 0; i < CONFIG.LEVELWIDTH / 32; i++){
        for(let j = 0; j < CONFIG.LEVELHEIGHT / 32; j++){
            addTileLevel0Coords(i,j,32, g_context.tile_index);
        }
    }
}

window.addEventListener(
    "keydown", (event) => {
        if (event.code == 'KeyF'){
            window.fill0();
        }
        else if (event.code == 'KeyG'){
            drawGrid(); 
        }
     }
  );

// Size of tiles we're working with
window.setGridDim = (val) => {
    console.log("setGridDim ",val);
    if(val == 16){
        if(g_context.tileDim == 16) {return;}
        CONFIG.NUM32XTILES /= (val/g_context.tileDim);
        CONFIG.NUM32YTILES /= (val/g_context.tileDim);
        g_context.tileDim = 16; 
        g_context.dimlog = Math.log2(g_context.tileDim); 
        curtiles = tiles16;
        console.log("set to curTiles16");
    }else if (val == 32){
        if(g_context.tileDim == 32) {return;}
        CONFIG.NUM32XTILES /= (val/g_context.tileDim);
        CONFIG.NUM32YTILES /= (val/g_context.tileDim);
        g_context.tileDim = 32; 
        g_context.dimlog = Math.log2(g_context.tileDim); 
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
const bt = PIXI.BaseTexture.from(CONFIG.TILESETFILE, {
    scaleMode: PIXI.SCALE_MODES.NEAREST,
  });
for (let x = 0; x < CONFIG.NUM32XTILES; x++) {
  for (let y = 0; y < CONFIG.NUM32YTILES; y++) {
    tiles32[x + y * CONFIG.NUM32XTILES] = new PIXI.Texture(
      bt,
      new PIXI.Rectangle(x * 32, y * 32, 32, 32),
    );
  }
}
for (let x = 0; x < CONFIG.NUM32XTILES*2; x++) {
  for (let y = 0; y < CONFIG.NUM32YTILES*2; y++) {
    tiles16[x + y * CONFIG.NUM32XTILES*2] = new PIXI.Texture(
      bt,
      new PIXI.Rectangle(x * 16, y * 16, 16, 16),
    );
  }
}

var square0 = INTER.set_interactive(level0_container);
var square1 = INTER.set_interactive(level1_container);
var square2 = INTER.set_interactive(level2_container);

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
    ctile.x = (xPx >> g_context.dimlog) << g_context.dimlog; 
    ctile2.x = (xPx >> g_context.dimlog) << g_context.dimlog; 
    ctile.y = (yPx>>g_context.dimlog) << g_context.dimlog;
    ctile2.y = (yPx>>g_context.dimlog) << g_context.dimlog;

    // console.log('ctile.x ', ctile.x, 'ctile.y ', ctile.y);
    let new_index = ctile.x + (ctile.y*CONFIG.NUM32XTILES*g_context.tileDim);
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

const tilesetcontainer = new PIXI.Container();
const texture = PIXI.Texture.from(CONFIG.TILESETFILE);
const bg = new PIXI.Sprite(texture);

var tilesetsq = new PIXI.Graphics();
tilesetsq.drawRect(0, 0, CONFIG.TILEFILEW, CONFIG.TILEFILEH);
tilesetsq.beginFill(0x2980b9);
tilesetsq.drawRect(0, 0, CONFIG.TILEFILEW, CONFIG.TILEFILEH);
tilesetsq.interactive = true;
tilesetcontainer.addChild(tilesetsq);
tilesetcontainer.addChild(bg);

tilesetsq.on('mousedown', function (e) {
    console.log('Mouse clicked');

    let tilex = Math.floor(e.data.global.x / g_context.tileDim);
    let tiley = Math.floor(e.data.global.y / g_context.tileDim);

    g_context.tile_index = (tiley * CONFIG.NUM32XTILES) + tilex;

    console.log('X', tilex, 'Y', tiley, 'index:  ',g_context.tile_index);
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
    console.log("onDragStartTileset()");
    tileset_app.stage.eventMode = 'static';
    tileset_app.stage.addEventListener('pointermove', onDrag);
    
    startx = e.data.global.x;
    starty = e.data.global.y;
    endx = e.data.global.x;
    endy = e.data.global.y;

    tileset_app.stage.addChild(dragsquare);

    g_context.selected_tiles = [];
}

// Stop dragging feedback once the handle is released.
function onDragEnd(e)
{
    console.log("onDragEndTileset()");
    tileset_app.stage.eventMode = 'auto';
    tileset_app.stage.removeEventListener('pointermove', onDrag);
    tileset_app.stage.removeChild(dragsquare);

    let starttilex = Math.floor(startx / g_context.tileDim);
    let starttiley = Math.floor(starty / g_context.tileDim);
    let endtilex = Math.floor(endx / g_context.tileDim);
    let endtiley = Math.floor(endy / g_context.tileDim);

    console.log("sx sy ex ey ",starttilex,",",starttiley,",",endtilex,",",endtiley);
    // let mouse clicked handle if there isn't a multiple tile square
    if(starttilex === endtilex && starttiley === endtiley ){
        return;
    }

    g_context.tile_index = (starttiley * CONFIG.NUM32XTILES) + starttilex;

    let origx = starttilex;
    let origy = starttiley;
    for(let i = starttilex; i <= endtilex; i++){
        for(let j = starttiley; j <= endtiley; j++){
            let squareindex = (j * CONFIG.NUM32XTILES) + i;
            console.log("i,j ",i,",",j);
            console.log("index ",squareindex);
            g_context.selected_tiles.push([i - origx,j - origy,squareindex]);
        }
    }
    dragsquare.clear();
}

function onDrag(e)
{
    console.log("onDragTileset()");
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
level_app0.stage.addEventListener('keydown', function handleKey(key)
{
    console.log('key! ',key);
});

level_app1.stage.addChild(level1_container);
level_app2.stage.addChild(level2_container);
composite_app.stage.addChild(composite_container);
tileset_app.stage.addChild(tilesetcontainer);

function drawGrid() {

    if (typeof drawGrid.lines == 'undefined') {
        drawGrid.toggle = true;
        drawGrid.lines = [];
        drawGrid.graphics = new PIXI.Graphics();

        let gridsize = g_context.tileDim;
        drawGrid.graphics.lineStyle(1, 0xffffff, 1);

        let index = 0;
        for (let i = 0; i < CONFIG.LEVELWIDTH; i += gridsize) {
            drawGrid.graphics.moveTo(i, 0);
            drawGrid.graphics.lineTo(i, CONFIG.LEVELHEIGHT);
            drawGrid.graphics.moveTo(i + gridsize, 0);
            drawGrid.graphics.lineTo(i + gridsize, CONFIG.LEVELHEIGHT);

            drawGrid.graphics.moveTo(0, i);
            drawGrid.graphics.lineTo(CONFIG.LEVELWIDTH, i);
            drawGrid.graphics.moveTo(0, i + gridsize);
            drawGrid.graphics.lineTo(CONFIG.LEVELWIDTH, i + gridsize);

            // tilesetcontainer.addChild(graphics);
            // level0_container.addChild(graphics.clone());
            // level1_container.addChild(graphics.clone());
            // level2_container.addChild(graphics.clone());
        }
            drawGrid.graphics0 = drawGrid.graphics.clone();
            drawGrid.graphics1 = drawGrid.graphics.clone();
            drawGrid.graphics2 = drawGrid.graphics.clone();
            drawGrid.graphics3 = drawGrid.graphics.clone();
    }

    if (drawGrid.toggle) {
        tilesetcontainer.addChild(drawGrid.graphics);
        level0_container.addChild(drawGrid.graphics0);
        level1_container.addChild(drawGrid.graphics1);
        level2_container.addChild(drawGrid.graphics2);
        composite_container.addChild(drawGrid.graphics3);
    }else{
        tilesetcontainer.removeChild(drawGrid.graphics);
        level0_container.removeChild(drawGrid.graphics0);
        level1_container.removeChild(drawGrid.graphics1);
        level2_container.removeChild(drawGrid.graphics2);
        composite_container.removeChild(drawGrid.graphics3);
    }

    drawGrid.toggle = !drawGrid.toggle;

    //if (indexswitch) {
    //    let style = { fontFamily: 'Arial', fontSize: 10, fill: 0xffffff, align: 'center', };
    //    for (let j = 0; j < CONFIG.LEVELHEIGHT; j += gridsize) {
    //        const itxt2 = new PIXI.Text('' + index, style);
    //        const itxt3 = new PIXI.Text('' + index, style);

    //        itxt2.x = j; itxt3.x = j;
    //        itxt2.y = i; itxt3.y = i;
    //        level0_container.addChild(itxt2);
    //        level1_container.addChild(itxt3);
    //        index++;
    //    }
    //}
}

// --
// Variable placement logic Level0
// --


function DragState() {
    this.leveldragsquare = new PIXI.Graphics();
    this.starx  = 0;
    this.starty = 0;
    this.endx   = 0;
    this.endy   = 0;
}


var dragsquare0 = new PIXI.Graphics();
var level0_sprites = {};
let dragctx0 = new DragState();
square0.on('mousedown',   drag_mousedown.bind(null,  level0_container, level0_sprites));
square0.on('mousemove',   drag_mousemove.bind(null));
square0.on('mouseover',    drag_mouseover);

square0.on('pointerdown', drag_pointerdown.bind(null, dragctx0, dragsquare0, level_app0))
         .on('pointerup', drag_onend.bind(null, dragctx0, dragsquare0, level_app0, level0_container, level0_sprites))
         .on('pointerupoutside', drag_onend.bind(null, dragctx0, dragsquare0, level_app0, level0_container, level0_sprites)); 

var dragsquare1 = new PIXI.Graphics();
var level1_sprites = {};
let dragctx1 = new DragState();
square1.on('mousedown',   drag_mousedown.bind(null,  level1_container, level1_sprites));
square1.on('mousemove',   drag_mousemove.bind(null));
square1.on('mouseover',    drag_mouseover);
square1.on('pointerdown', drag_pointerdown.bind(null, dragctx1, dragsquare1, level_app1))
         .on('pointerup', drag_onend.bind(null, dragctx1, dragsquare1, level_app1, level1_container, level1_sprites))
         .on('pointerupoutside', drag_onend.bind(null, dragctx1, dragsquare1, level_app1, level1_container, level1_sprites)); 

var dragsquare2 = new PIXI.Graphics();
var level2_sprites = {};
let dragctx2 = new DragState();
square2.on('mousedown',   drag_mousedown.bind(null,  level2_container, level2_sprites));
square2.on('mousemove',   drag_mousemove.bind(null));
square2.on('mouseover',    drag_mouseover);
square2.on('pointerdown', drag_pointerdown.bind(null, dragctx2, dragsquare2, level_app2))
         .on('pointerup', drag_onend.bind(null, dragctx2, dragsquare2, level_app2, level2_container, level2_sprites))
         .on('pointerupoutside', drag_onend.bind(null, dragctx2, dragsquare2, level_app2, level2_container, level2_sprites)); 


// --
// Variable placement logic Level1
// --

var compositecircle = new PIXI.Graphics();
function drag_mouseover(e) {
    composite_app.stage.removeChild(compositecircle);
    composite_app.stage.addChild(compositecircle);
}
function drag_mousemove(e) {
    compositecircle.clear();
    compositecircle.beginFill(0xe50000, 0.5);
    compositecircle.drawCircle(e.data.global.x, e.data.global.y, 3);
    compositecircle.endFill();
}

function drag_mousedown(level_container, level_sprites, e) {
    console.log('Level 0: X', e.data.global.x, 'Y', e.data.global.y);

    let xorig = e.data.global.x;
    let yorig = e.data.global.y;

    if (g_context.selected_tiles.length == 0) {
        addTileLevelPx(e.data.global.x, e.data.global.y, g_context.tile_index, level_container, level_sprites);
    } else {

        for (let index of g_context.selected_tiles) {
            addTileLevelPx(xorig + index[0] * g_context.tileDim, yorig + index[1] * g_context.tileDim, index[2], level_container, level_sprites);
        }
    }
}

// Listen to pointermove on stage once handle is pressed.
function drag_pointerdown(ctx, leveldragsquare, level_app, e)
{
    console.log("drag_pointerdown()");
    level_app.stage.eventMode = 'static';
    level_app.stage.addEventListener('pointermove', on_drag.bind(null, ctx, leveldragsquare));

    ctx.startx0 = e.data.global.x;
    ctx.starty0 = e.data.global.y;
    ctx.endx0 = e.data.global.x;
    ctx.endy0 = e.data.global.y;

    level_app.stage.addChild(leveldragsquare);
}

function on_drag(ctx, leveldragsquare, e)
{
    if(ctx.startx0 == -1){
        return;
    }

    ctx.endx0 = e.data.global.x;
    ctx.endy0 = e.data.global.y;

    console.log("on_drag()");
    
    leveldragsquare.clear();
    leveldragsquare.beginFill(0xFF3300, 0.3);
    leveldragsquare.lineStyle(2, 0xffd900, 1);
    leveldragsquare.moveTo(ctx.startx0, ctx.starty0);
    leveldragsquare.lineTo(ctx.endx0, ctx.starty0);
    leveldragsquare.lineTo(ctx.endx0, ctx.endy0);
    leveldragsquare.lineTo(ctx.startx0, ctx.endy0);
    leveldragsquare.closePath();
    leveldragsquare.endFill();
}

// Stop dragging feedback once the handle is released.
function drag_onend(ctx, leveldragsquare, level_app, level_container, level_sprites, e)
{
    ctx.endx0 = e.data.global.x;
    ctx.endy0 = e.data.global.y;
    if(ctx.startx0 == -1){
        return;
    }
    console.log("drag_onend()");
    level_app.stage.eventMode = 'auto';
    level_app.stage.removeChild(leveldragsquare);

    let starttilex = Math.floor(ctx.startx0 / g_context.tileDim);
    let starttiley = Math.floor(ctx.starty0 / g_context.tileDim);
    let endtilex = Math.floor(ctx.endx0 / g_context.tileDim);
    let endtiley = Math.floor(ctx.endy0 / g_context.tileDim);

    console.log("sx ",starttilex," ex ",endtilex);
    console.log("sy ",starttiley," ey ",endtiley);

    // let mouse clicked handle if there isn't a multiple tile square
    if(starttilex === endtilex && starttiley == endtiley ){
        return;
    }

    if (g_context.selected_tiles.length == 0) {
        for (let i = starttilex; i <= endtilex; i++) {
            for (let j = starttiley; j <= endtiley; j++) {
                let squareindex = (j * CONFIG.NUM32XTILES) + i;
                console.log("i,j ", i, ",", j);
                console.log("index ", squareindex);
                addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, g_context.tile_index, level_container, level_sprites);

            }
        }
    } else {

        // figure out selected grid
        let selected_grid = [50];
        let row = 0;
        let column = 0;
        let selected_row = g_context.selected_tiles[0][0];
        selected_grid[0] = [];
        for (let index of g_context.selected_tiles) {
            if(index[0] != selected_row){
                selected_row = index[0];
                row++;
                column = 0;
                selected_grid[row] = [];
            }
            selected_grid[row][column++]  = index;
        }
        // at this point should have a 3D array of the selected tiles and the size should be row, column

        for (let i = starttilex; i <= endtilex; i++) {
            for (let j = starttiley; j <= endtiley; j++) {
                let squareindex = (j * CONFIG.NUM32XTILES) + i;
                if (j === starttiley) { // first row 
                    if (i === starttilex) { // top left corner
                        console.log("Top left!");
                        addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[0][0][2], level_container, level_sprites);
                    }
                    else if (i == endtilex ) { // top right corner
                        console.log("Top right!");
                        addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[column-1][0][2], level_container, level_sprites);
                    }else{ // top middle
                        addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[1][0][2], level_container, level_sprites);
                    }
                } else if (j === endtiley){ // last row
                    if (i === starttilex) { // bottom left corner
                        console.log("Bottom left!");
                        addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[0][row][2], level_container, level_sprites);
                    }
                    else if (i == endtilex ) { // bottom right corner
                        console.log("Bottom right!");
                        addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[column-1][row][2], level_container, level_sprites);
                    }else{ // bottom middle
                        addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[1][row][2], level_container, level_sprites);
                    }
                }else{ // middle row
                    if (i === starttilex) { // middle left 
                        addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[0][1][2], level_container, level_sprites);
                    }
                    else if (i === endtilex ) { // middle end 
                        addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[column-1][1][2], level_container, level_sprites);
                    }else{ // middle middle
                        addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[1][1][2], level_container, level_sprites);
                    }
                } 

            }
        }
    }

    leveldragsquare.clear();

    ctx.startx0 = -1;
    ctx.starty0 = -1;
}
