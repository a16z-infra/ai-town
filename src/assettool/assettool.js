// --
// Simple level editer. 
//
// TODO: 
//  - move more globals and class declarations into the global context context.js
//  - get rid of dangerous CONFIG.tiledim (use g_context.tileDim instead)
//  - todo fudge factor on tileset
//  - todo print locations on screen
// 
// Done:
//  - Delete tiles
//  - move magic numbers to context / initialization (zIndex, pane size etc.)
//
// 
// Keybindings:
// f - fill level 0 with current tile
// <ctl>-z - undo
// g - overlay 32x32 grid
// s - generate .js file to move over to convex/maps/
// m - place a semi-transparent red mask over all tiles. This helps find invisible tiles
// d - hold while clicking a tile to delete
// 
// Known bugs and annoyances
//  - if deleting a tile while filter is on, filter isn't refreshed so need to toggle with "m"
// --

import * as PIXI from 'pixi.js'
import { g_context }  from './context.js' // global context
import * as CONFIG from './levelconfig.js' 
import * as UNDO from './undo.js'
import * as MAPFILE from './mapfile.js'
import { EventSystem } from '@pixi/events';

const debug_flag = true;

function tile_index_from_coords(x, y) {
    return x + (y*CONFIG.screenxtiles*g_context.tileDim);
}

function tile_index_from_px(x, y) {
    let coord_x = Math.floor(x / g_context.tileDim);
    let coord_y = Math.floor(y / g_context.tileDim);
    return tile_index_from_coords(coord_x, coord_y); 
}

function fudgeon(ctx) {
    return ctx.fudgex != 0 || ctx.fudgey != 0;
}

function DragState() {
    this.square = new PIXI.Graphics();
    this.startx  = 0;
    this.starty = 0;
    this.endx   = 0;
    this.endy   = 0;
}

class LayerContext {

    constructor(app, pane, num, mod = null) {
        this.app = app;
        this.scrollpane = pane;
        this.num = num;
        this.container = new PIXI.Container();
        this.sprites = {};
        this.composite_sprites = {};
        this.dragctx = new DragState();

        app.stage.addChild(this.container);

        this.mouseshadow    = new PIXI.Container(); 
        this.mouseshadow.zIndex = CONFIG.zIndexMouseShadow; 
        this.lasttileindex  = -1; 

        this.fudgex = 0; // offset from 0,0
        this.fudgey = 0;

        this.square = new PIXI.Graphics();
        this.square.beginFill(0x2980b9);
        this.square.drawRect(0, 0, CONFIG.levelwidth, CONFIG.levelheight);
        this.square.endFill();
        this.square.interactive = true;
        this.container.addChild(this.square);

        this.square.on('mousemove', onLevelMousemove.bind(this));
        this.square.on('mouseover', onLevelMouseover.bind(this));
        this.square.on('pointerout', onLevelMouseOut.bind(this))
        this.square.on('pointerdown', onLevelPointerDown.bind(null, this))
            .on('pointerup', onLevelDragEnd.bind(null, this))
            .on('pointerupoutside', onLevelDragEnd.bind(null, this));

        if (mod != null) {
            this.loadFromMapFile(mod);
        }
    }

    loadFromMapFile(mod) {
        let tiles = [];
        if (this.num == 0) {
            tiles = mod.bgtiles[0];
        } else if (this.num == 1) {
            tiles = mod.bgtiles[1];
        } else if (this.num == 2) {
            tiles = mod.objmap[0];
        } else if (this.num == 3) {
            tiles = mod.objmap[1];
        } else {
            console.log("loadFromMapFile: Error unknow layer number");
            return;
        }

        for (let x = 0; x < tiles.length; x++) {
            for (let y = 0; y < tiles[0].length; y++) {
                if (tiles[x][y] != -1) {
                    this.addTileLevelCoords(x, y, mod.tiledim, tiles[x][y]);
                }
            }
        }
    }

    //  this will create a rectangle with an alpha channel for every square that has a sprite. This helps find 
    //  sprites that are purely transparent
    drawFilter() {

        if (typeof this.filtergraphics == 'undefined') {
            this.filtertoggle = true;
            this.filtergraphics = new PIXI.Graphics();
            this.filtergraphics.zIndex = CONFIG.zIndexFilter;
        }

        if (this.filtertoggle) {

            this.filtergraphics.beginFill(0xff0000, 0.3);
            for (let i in this.sprites) {
                let spr = this.sprites[i];
                this.filtergraphics.drawRect(spr.x, spr.y, g_context.tileDim, g_context.tileDim);
            }
            this.filtergraphics.endFill();
            this.container.addChild(this.filtergraphics);
        }else{
            this.filtergraphics.clear();
            this.container.removeChild(this.filtergraphics);
        }

        this.filtertoggle = ! this.filtertoggle;
    }

    addTileLevelCoords(x, y, dim, index) {
        return this.addTileLevelPx(x * dim, y * dim, index);
    }

    addTileLevelPx(x, y, index) {
        let xPx = x;
        let yPx = y;

        const ctile = new PIXI.Sprite(g_context.curtiles[index]);  // level map
        ctile.index = index; // stuff index into sprite for generating map.js
        const ctile2 = new PIXI.Sprite(g_context.curtiles[index]); // composite map

        // TODO! if fudge is one, create a new sprite

        // snap to grid
        ctile.x = (xPx >> g_context.dimlog) << g_context.dimlog;
        ctile2.x = (xPx >> g_context.dimlog) << g_context.dimlog;
        ctile.y = (yPx >> g_context.dimlog) << g_context.dimlog;
        ctile2.y = (yPx >> g_context.dimlog) << g_context.dimlog;
        ctile2.zIndex = this.num; 

        let new_index = tile_index_from_px(ctile.x, ctile.y);

        if(debug_flag){
            console.log('addTileLevelPx ',this.num,' ctile.x ', ctile.x, 'ctile.y ', ctile.y, "index ", index, "new_index", new_index);
        }

        if (!g_context.dkey) {
            this.container.addChild(ctile);
            composite.container.addChild(ctile2);
        } 


        if (this.sprites.hasOwnProperty(new_index)) {
            if(debug_flag){
             console.log("addTileLevelPx: ",this.num,"removing old tile", new_index);
            }
            this.container.removeChild(this.sprites[new_index]);
            delete this.sprites[new_index];
            // composite.container.removeChild(composite.sprites[(this.num, new_index)]);
            composite.container.removeChild(this.composite_sprites[new_index]);
            delete this.composite_sprites[new_index];
            // console.log("DELETING ZINDEX ", this.composite_sprites[new_index].zIndex);
        }

        if (!g_context.dkey) {
            this.sprites[new_index] = ctile;
            this.composite_sprites[new_index] = ctile2;
        } else if (typeof this.filtergraphics != 'undefined') {
            this.filtergraphics.clear();
            this.drawFilter();
            this.drawFilter();
        }

        // consolelog("SETTING ZINDEX ", this.composite_sprites[new_index].zIndex);
        return new_index;
    }

} // class  LayerContext

class TilesetContext {

    constructor(app, mod = CONFIG) {
        this.app = app;
        this.container = new PIXI.Container();

        console.log(mod.tilesetpath);
        const texture = PIXI.Texture.from(mod.tilesetpath);
        const bg    = new PIXI.Sprite(texture);
        this.square = new PIXI.Graphics();
        this.square.drawRect(0, 0, mod.tilefilew, mod.tilefileh);
        this.square.beginFill(0x2980b9);
        this.square.drawRect(0, 0, mod.tilefilew, mod.tilefileh);
        this.square.interactive = true;
        this.container.addChild(this.square);
        this.container.addChild(bg);
        
        this.app.stage.addChild(this.container);

        this.fudgex = 0; // offset from 0,0
        this.fudgey = 0;

        this.dragctx = new DragState();

        this.square.on('mousedown', function (e) {
            let tilex = Math.floor(e.data.global.x / g_context.tileDim);
            let tiley = Math.floor(e.data.global.y / g_context.tileDim);

            g_context.tile_index = (tiley * mod.tilefilew / g_context.tileDim) + tilex;

            if(debug_flag) {
                console.log("tileset mouse down. index "+g_context.tile_index);
            }
        });

        this.square.on('pointerdown', onTilesetDragStart)
                .on('pointerup', onTilesetDragEnd)
                .on('pointerupoutside', onTilesetDragEnd);
    }
} // class TilesetContext


class CompositeContext {

    constructor(app) {
        this.app = app;
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;
        this.app.stage.addChild(this.container);
        this.sprites = {};
        this.circle = new PIXI.Graphics();
        this.circle.zIndex = CONFIG.zIndexCompositePointer;

        this.fudgex = 0; // offset from 0,0
        this.fudgey = 0;

        this.mouseshadow    = new PIXI.Container(); 
        this.mouseshadow.zIndex = CONFIG.zIndexMouseShadow; 
        this.lasttileindex  = -1; 

        this.square = new PIXI.Graphics();
        this.square.beginFill(0x2980b9);
        this.square.drawRect(0, 0, CONFIG.levelwidth, CONFIG.levelheight);
        this.square.endFill();
        this.square.interactive = true;
        this.container.addChild(this.square);

        this.square.on('mousedown', onCompositeMousedown.bind(null, this));
    }

} // class CompositeContext

// -- Editor wide globals --

// First layer of level
const level_app0 = new PIXI.Application( {backgroundColor: 0x2980b9, width : CONFIG.levelwidth, height : CONFIG.levelheight, view: document.getElementById('level0')});
let layer0 = new LayerContext(level_app0,document.getElementById("layer0pane"), 0);

// second layer of level 
const level_app1 = new PIXI.Application( {backgroundColor: 0x2980b9, width : CONFIG.levelwidth, height : CONFIG.levelheight, view: document.getElementById('level1')});
let layer1 = new LayerContext(level_app1,document.getElementById("layer1pane"), 1);

//  object layer of level
const level_app2    = new PIXI.Application( {backgroundColor: 0x2980b9, width : CONFIG.levelwidth, height : CONFIG.levelheight, view: document.getElementById('level3')});
let layer2 = new LayerContext(level_app2,document.getElementById("layer2pane"), 2);

//  object layer of level
const level_app3    = new PIXI.Application( {backgroundColor: 0x2980b9, width : CONFIG.levelwidth, height : CONFIG.levelheight, view: document.getElementById('level4')});
let layer3 = new LayerContext(level_app3,document.getElementById("layer3pane"), 3);


let g_layers = [];
g_layers.push(layer0);
g_layers.push(layer1);
g_layers.push(layer2);
g_layers.push(layer3);

// composite view 
const composite_app = new PIXI.Application( {backgroundColor: 0x2980b9, width : CONFIG.levelwidth, height : CONFIG.levelheight, view: document.getElementById('composite')});
const composite = new CompositeContext(composite_app);

//  map tab 
const map_app    = new PIXI.Application( {backgroundColor: 0x2980b9, width : CONFIG.levelwidth, height : CONFIG.levelheight, view: document.getElementById('mapcanvas')});

// tileset
const tileset_app = new PIXI.Application( {width :CONFIG.tilefilew, height : CONFIG.tilefileh, view: document.getElementById('tileset')});
const { renderer } = tileset_app;
// Install the EventSystem
renderer.addSystem(EventSystem, 'tileevents');
let tileset = new TilesetContext(tileset_app);



function doimport (str) {
    if (globalThis.URL.createObjectURL) {
      const blob = new Blob([str], { type: 'text/javascript' })
      const url = URL.createObjectURL(blob)
      const module = import(url)
      URL.revokeObjectURL(url) // GC objectURLs
      return module
    }
    
    const url = "data:text/javascript;base64," + btoa(moduleData)
    return import(url)
  }

  function loadMapFromModule(mod) {
    tileset = new TilesetContext(tileset_app, mod);
    layer0 = new LayerContext(level_app0,document.getElementById("layer0pane"), 0, mod);
    layer1 = new LayerContext(level_app1,document.getElementById("layer1pane"), 1, mod);
    layer2 = new LayerContext(level_app2,document.getElementById("layer2pane"), 2, mod);
    layer3 = new LayerContext(level_app3,document.getElementById("layer3pane"), 3, mod);
  }
  
window.onTab = (evt, tabName) => {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    if (tabName == "map"){
        console.log("MAP!");
        map_app.stage.addChild(composite.container);
    }else {
        composite.app.stage.addChild(composite.container);
    }
}

// fill base level with currentIndex tile 
window.fill0 = () => {
    UNDO.undo_mark_task_start(layer0);
    for(let i = 0; i < CONFIG.levelwidth / g_context.tileDim; i++){
        for(let j = 0; j < CONFIG.levelheight / g_context.tileDim; j++){
            let ti = layer0.addTileLevelCoords(i,j,g_context.tileDim, g_context.tile_index);
            UNDO.undo_add_index_to_task(ti);
        }
    }
    UNDO.undo_mark_task_end();
}

window.addEventListener(
    "keyup", (event) => {
        if (event.code == "KeyD"){
            g_context.dkey = false;
            g_layers.map( (l) => l.container.addChild(l.mouseshadow));
            composite.container.addChild(composite.mouseshadow);
        }
    });
window.addEventListener(
    "keydown", (event) => {

        if (event.code == "KeyD"){
            g_context.dkey = true;
            g_layers.map((l) => l.container.removeChild(l.mouseshadow) );
            composite.container.removeChild(composite.mouseshadow);
        }

        if (event.code == 'KeyF'){
            window.fill0();
        }
        else if (event.code == 'KeyS'){
            MAPFILE.generate_level_file(g_layers);
        }
        else if (event.code == 'KeyM'){
            g_layers.map((l) => l.drawFilter () );
        }
        else if (event.code == 'KeyG'){
            g_layers.map((l) => redrawGrid (l, false) );
            redrawGrid(tileset, false); 
            redrawGrid(composite, false); 
        }
        else if (event.ctrlKey && event.code === 'KeyZ'){
            let undome = UNDO.undo_pop();
            if (!undome) {
                return;
            }
            let layer = undome.shift();
            for(let i = 0; i < undome.length; i++) {
                if (debug_flag) {
                    console.log("Undo removing ", undome[i])
                }
                layer.container.removeChild(layer.sprites[undome[i]]);
                composite.container.removeChild(layer.composite_sprites[undome[i]]);
            }
        }
        else if (event.shiftKey && event.code == 'ArrowUp') {
            tileset.fudgey -= 1;
            redrawGrid(tileset, true);
        }
        else if (event.shiftKey && event.code == 'ArrowDown') {
            tileset.fudgey += 1;
            redrawGrid(tileset, true);
        }
        else if (event.shiftKey && event.code == 'ArrowLeft') {
            tileset.fudgex -= 1;
            redrawGrid(tileset, true);
        }
        else if (event.shiftKey && event.code == 'ArrowRight') {
            tileset.fudgex += 1;
            redrawGrid(tileset, true);
        }
     }
  );

// Listen to pointermove on stage once handle is pressed.

function onTilesetDragStart(e)
{
    if (debug_flag) {
        console.log("onDragStartTileset()");
    }
    tileset.app.stage.eventMode = 'static';
    tileset.app.stage.addEventListener('pointermove', onTilesetDrag);
    
    tileset.dragctx.startx = e.data.global.x;
    tileset.dragctx.starty = e.data.global.y;
    tileset.dragctx.endx = e.data.global.x;
    tileset.dragctx.endy = e.data.global.y;

    tileset.app.stage.addChild(tileset.dragctx.square);

    g_context.selected_tiles = [];
}

// Stop dragging feedback once the handle is released.
function onTilesetDragEnd(e)
{
    if (debug_flag) {
        console.log("onDragEndTileset()");
    }
    tileset.app.stage.eventMode = 'auto';
    tileset.app.stage.removeEventListener('pointermove', onTilesetDrag);
    tileset.app.stage.removeChild(tileset.dragctx.square);

    let starttilex = Math.floor(tileset.dragctx.startx / g_context.tileDim);
    let starttiley = Math.floor(tileset.dragctx.starty / g_context.tileDim);
    let endtilex = Math.floor(tileset.dragctx.endx / g_context.tileDim);
    let endtiley = Math.floor(tileset.dragctx.endy / g_context.tileDim);

    if (debug_flag) {
        console.log("sx sy ex ey ", starttilex, ",", starttiley, ",", endtilex, ",", endtiley);
    }
    // let mouse clicked handle if there isn't a multiple tile square
    if(starttilex === endtilex && starttiley === endtiley ){
        return;
    }

    g_context.tile_index = (starttiley * CONFIG.screenxtiles) + starttilex;

    let origx = starttilex;
    let origy = starttiley;
    for(let y = starttiley; y <= endtiley; y++){
        for(let x = starttilex; x <= endtilex; x++){
            let squareindex = (y * CONFIG.screenxtiles) + x;
            g_context.selected_tiles.push([x - origx,y - origy,squareindex]);
        }
    }
    tileset.dragctx.square.clear();
}

function onTilesetDrag(e)
{
    if (debug_flag) {
        console.log("onDragTileset()");
    }
    tileset.dragctx.endx = e.data.global.x;
    tileset.dragctx.endy = e.data.global.y;
    
    tileset.dragctx.square.clear();
    tileset.dragctx.square.beginFill(0xFF3300, 0.3);
    tileset.dragctx.square.lineStyle(2, 0xffd900, 1);
    tileset.dragctx.square.moveTo(tileset.dragctx.startx, tileset.dragctx.starty);
    tileset.dragctx.square.lineTo(tileset.dragctx.endx, tileset.dragctx.starty);
    tileset.dragctx.square.lineTo(tileset.dragctx.endx, tileset.dragctx.endy);
    tileset.dragctx.square.lineTo(tileset.dragctx.startx, tileset.dragctx.endy);
    tileset.dragctx.square.closePath();
    tileset.dragctx.square.endFill();
}

//tileset.app.stage.addChild(tileset.container);

function redrawGrid(pane, redraw = false) {

    if (typeof pane.gridtoggle == 'undefined') {
        // first time we're being called, initialized
        pane.gridtoggle  = false;
        pane.gridvisible = false;
        redraw = true;
        pane.gridvisible = true;
    }

    if (redraw) {
        if (typeof pane.gridgraphics != 'undefined') {
            pane.container.removeChild(pane.gridgraphics);
        }

        pane.gridgraphics = new PIXI.Graphics();
        let gridsize = g_context.tileDim;
        pane.gridgraphics.lineStyle(1, 0xffffff, 1);


        let index = 0;
        for (let i = 0; i < CONFIG.levelwidth; i += gridsize) {
            pane.gridgraphics.moveTo(i + pane.fudgex, 0 + pane.fudgey);
            pane.gridgraphics.lineTo(i + pane.fudgex, CONFIG.levelheight + pane.fudgey);
            pane.gridgraphics.moveTo(i + gridsize + pane.fudgex, 0 + pane.fudgey);
            pane.gridgraphics.lineTo(i + gridsize + pane.fudgex, CONFIG.levelheight + pane.fudgey);

            pane.gridgraphics.moveTo(0 + pane.fudgex, i + pane.fudgey);
            pane.gridgraphics.lineTo(CONFIG.levelwidth + pane.fudgex, i + pane.fudgey);
            pane.gridgraphics.moveTo(0 + pane.fudgex, i + gridsize + pane.fudgey);
            pane.gridgraphics.lineTo(CONFIG.levelwidth + pane.fudgex, i + gridsize + pane.fudgey);
        }
        if(pane.gridvisible){
            pane.container.addChild(pane.gridgraphics);
        }
        return;
    }

    if (pane.gridtoggle) {
        pane.container.addChild(pane.gridgraphics);
        pane.gridvisible = true;
    }else{
        pane.container.removeChild(pane.gridgraphics);
        pane.gridvisible = false;
    }

    pane.gridtoggle = !pane.gridtoggle;
}


// --
// Variable placement logic Level1
// --

function centerCompositePane(x, y){
    var compositepane = document.getElementById("compositepane");
    compositepane.scrollLeft = x - (CONFIG.htmlCompositePaneW/2);
    compositepane.scrollTop  = y - (CONFIG.htmlCompositePaneH/2);
}

function centerLayerPanes(x, y){
    // TODO remove magic number pulled from index.html
    g_layers.map((l) => {
        l.scrollpane.scrollLeft = x - (CONFIG.htmlCompositePaneW/2);
        l.scrollpane.scrollTop  = y - (CONFIG.htmlCompositePaneH/2);
      });
}

function onLevelMouseover(e) {
    let x = e.data.global.x;
    let y = e.data.global.y;
    if(debug_flag){
        console.log("onLevelMouseOver ",this.num);
    }
    if (x < this.scrollpane.scrollLeft || x > this.scrollpane.scrollLeft + CONFIG.htmlCompositePaneW) {
        return;
    }
    if (y < this.scrollpane.scrollTop || y > this.scrollpane.scrollTop + CONFIG.htmlCompositePaneH) {
        return;
    }

    if (this.lasttileindex != g_context.tile_index) {
        this.mouseshadow.removeChildren(0);
        composite.mouseshadow.removeChildren(0);
        if (g_context.selected_tiles.length == 0) {
            const shadowsprite = new PIXI.Sprite(g_context.curtiles[g_context.tile_index]); // composite map
            const shadowsprite2 = new PIXI.Sprite(g_context.curtiles[g_context.tile_index]); // composite map
            shadowsprite.alpha = .5;
            shadowsprite2.alpha = .5;
            this.mouseshadow.addChild(shadowsprite);
            composite.mouseshadow.addChild(shadowsprite2);
        } else {
            for (let i = 0; i < g_context.selected_tiles.length; i++) {
                let tile = g_context.selected_tiles[i];
                console.log(tile, tile[2], tile[0], tile[1]);
                const shadowsprite = new PIXI.Sprite(g_context.curtiles[tile[2]]);
                const shadowsprite2 = new PIXI.Sprite(g_context.curtiles[tile[2]]);
                shadowsprite.x = tile[0] * g_context.tileDim;
                shadowsprite.y = tile[1] * g_context.tileDim;
                shadowsprite2.x = tile[0] * g_context.tileDim;
                shadowsprite2.y = tile[1] * g_context.tileDim;
                shadowsprite.alpha = .5;
                shadowsprite2.alpha = .5;
                this.mouseshadow.addChild(shadowsprite);
                composite.mouseshadow.addChild(shadowsprite2);
            }

        }
        this.mouseshadow.x = x - 16;
        this.mouseshadow.y = y - 16;
        this.container.removeChild(this.mouseshadow);
        composite.container.removeChild(composite.mouseshadow);
        this.container.addChild(this.mouseshadow);
        composite.container.addChild(composite.mouseshadow);
    }

    composite.app.stage.removeChild(composite.circle);
    composite.app.stage.addChild(composite.circle);
}


function onLevelMouseOut(e) {
    if (debug_flag) {
        console.log("onLevelMouseOut ",this.num);
    }
    this.mouseshadow.removeChildren(0);
    composite.mouseshadow.removeChildren(0);
}

function onLevelMousemove(e) {
    let x = e.data.global.x;
    let y = e.data.global.y;

    // FIXME TEST CODE
    this.mouseshadow.x = x-8;
    this.mouseshadow.y = y-8;
    composite.mouseshadow.x = x-8;
    composite.mouseshadow.y = y-8;
    // FIXME TEST CODE


    if (x < this.scrollpane.scrollLeft || x > this.scrollpane.scrollLeft + CONFIG.htmlCompositePaneW) {
        return;
    }
    if (y < this.scrollpane.scrollTop || y > this.scrollpane.scrollTop + CONFIG.htmlCompositePaneH) {
        return;
    }

    composite.circle.clear();
    composite.circle.beginFill(0xe50000, 0.5);
    composite.circle.drawCircle(e.data.global.x, e.data.global.y, 3);
    composite.circle.endFill();
}
function onCompositeMousedown(layer, e) {
    if (debug_flag) {
        console.log('onCompositeMouseDown: X', e.data.global.x, 'Y', e.data.global.y);
    }

    let xorig = e.data.global.x;
    let yorig = e.data.global.y;

    centerLayerPanes(xorig,yorig);
}


// Place with no variable target at destination
function levelPlaceNoVariable(layer, e) {
    if (debug_flag) {
        console.log('levelPlaceNoVariable: X', e.data.global.x, 'Y', e.data.global.y);
    }

    let xorig = e.data.global.x;
    let yorig = e.data.global.y;

    centerCompositePane(xorig,yorig);

    if (g_context.dkey || g_context.selected_tiles.length == 0) {
        let ti = layer.addTileLevelPx(e.data.global.x, e.data.global.y, g_context.tile_index);
        UNDO.undo_add_single_index_as_task(layer, ti);
    } else {
        let undolist = [];
        UNDO.undo_mark_task_start(layer);
        for (let index of g_context.selected_tiles) {
            let ti = layer.addTileLevelPx(xorig + index[0] * g_context.tileDim, yorig + index[1] * g_context.tileDim, index[2]);
            UNDO.undo_add_index_to_task(ti);
        }
        UNDO.undo_mark_task_end();
    }
}

// Listen to pointermove on stage once handle is pressed.
function onLevelPointerDown(layer, e)
{
    if (debug_flag) {
        console.log("onLevelPointerDown()");
    }
    layer.app.stage.eventMode = 'static';
    layer.app.stage.addEventListener('pointermove', onLevelDrag.bind(null, layer, e));

    //FIXME TEST CODE stop showing mouse shadow while dragging
    layer.container.removeChild(layer.mouseshadow);
    composite.container.removeChild(composite.mouseshadow);

    layer.dragctx.startx = e.data.global.x;
    layer.dragctx.starty = e.data.global.y;
    layer.dragctx.endx = e.data.global.x;
    layer.dragctx.endy = e.data.global.y;

    layer.app.stage.addChild(layer.dragctx.square);
}

function onLevelDrag(layer, e)
{
    if(layer.dragctx.startx == -1){
        layer.dragctx.square.clear();
        return;
    }

    layer.dragctx.endx = e.data.global.x;
    layer.dragctx.endy = e.data.global.y;

    if (debug_flag) {
        console.log("onLevelDrag()");
    }
    
    layer.dragctx.square.clear();
    layer.dragctx.square.beginFill(0xFF3300, 0.3);
    layer.dragctx.square.lineStyle(2, 0xffd900, 1);
    layer.dragctx.square.moveTo(layer.dragctx.startx, layer.dragctx.starty);
    layer.dragctx.square.lineTo(layer.dragctx.endx, layer.dragctx.starty);
    layer.dragctx.square.lineTo(layer.dragctx.endx, layer.dragctx.endy);
    layer.dragctx.square.lineTo(layer.dragctx.startx, layer.dragctx.endy);
    layer.dragctx.square.closePath();
    layer.dragctx.square.endFill();
}

// Stop dragging feedback once the handle is released.
function onLevelDragEnd(layer, e)
{
    layer.dragctx.endx = e.data.global.x;
    layer.dragctx.endy = e.data.global.y;

    if(layer.dragctx.startx == -1){
        console.log("onLevelDragEnd() start is -1 bailing");
        return;
    }
    if (debug_flag) {
        console.log("onLevelDragEnd()");
    }

    //FIXME TEST CODE show mouseshadow again once done draggin
    layer.container.addChild(layer.mouseshadow);
    composite.container.addChild(composite.mouseshadow);

    layer.app.stage.eventMode = 'auto';
    layer.app.stage.removeChild(layer.dragctx.square);

    let starttilex = Math.floor(layer.dragctx.startx / g_context.tileDim);
    let starttiley = Math.floor(layer.dragctx.starty / g_context.tileDim);
    let endtilex = Math.floor(layer.dragctx.endx / g_context.tileDim);
    let endtiley = Math.floor(layer.dragctx.endy / g_context.tileDim);

    if (debug_flag) {
        console.log("sx ", starttilex, " ex ", endtilex);
        console.log("sy ", starttiley, " ey ", endtiley);
    }

    // no variable placement. 
    if(starttilex === endtilex && starttiley == endtiley ){
        levelPlaceNoVariable(layer, e);
        layer.dragctx.startx = -1;
        layer.dragctx.endx    = -1;
        layer.dragctx.starty = -1;
        layer.dragctx.endy    = -1;
        return;
    }

    if (g_context.selected_tiles.length == 0) {
        UNDO.undo_mark_task_start(layer);
        for (let i = starttilex; i <= endtilex; i++) {
            for (let j = starttiley; j <= endtiley; j++) {
                let squareindex = (j * CONFIG.screenxtiles) + i;
                let ti = layer.addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, g_context.tile_index);
                UNDO.undo_add_index_to_task(ti);
            }
        }
        UNDO.undo_mark_task_end();
    } else {
        // figure out selected grid
        let selected_grid = Array.from(Array(64), () => new Array(64)); // FIXME ... hope 64x64 is enough
        let row = 0;
        let column = 0;
        let selected_row = g_context.selected_tiles[0][1];
        // selected_grid[0] = [];
        for (let index of g_context.selected_tiles) {
            // console.log("Selected row ", selected_row, index);
            if(index[1] != selected_row){
                selected_row = index[1];
                row++;
                column = 0;
                //selected_grid[row] = [];
            }
            selected_grid[column++][row]  = index;
        }
        // at this point should have a 3D array of the selected tiles and the size should be row, column

        UNDO.undo_mark_task_start(layer);

        let ti=0;
        for (let i = starttilex; i <= endtilex; i++) {
            for (let j = starttiley; j <= endtiley; j++) {
                let squareindex = (j * CONFIG.screenxtiles) + i;
                if (j === starttiley) { // first row 
                    if (i === starttilex) { // top left corner
                        ti = layer.addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[0][0][2]);
                    }
                    else if (i == endtilex) { // top right corner
                        ti = layer.addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[column - 1][0][2]);
                    } else { // top middle
                        ti = layer.addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[1][0][2]);
                    }
                } else if (j === endtiley) { // last row
                    if (i === starttilex) { // bottom left corner
                        ti = layer.addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[0][row][2]);
                    }
                    else if (i == endtilex) { // bottom right corner
                        ti = layer.addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[column - 1][row][2]);
                    } else { // bottom middle
                        ti = layer.addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[1][row][2]);
                    }
                } else { // middle row
                    if (i === starttilex) { // middle left 
                        ti = layer.addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[0][(row > 0)? 1 : 0][2]);
                    }
                    else if (i === endtilex) { // middle end 
                        ti = layer.addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[column - 1][(row > 0)? 1 : 0][2]);
                    } else { // middle middle
                        ti = layer.addTileLevelPx(i * g_context.tileDim, j * g_context.tileDim, selected_grid[1][(row > 0)? 1 : 0][2]);
                    }
                }
                UNDO.undo_add_index_to_task(ti);
            }
        }
        UNDO.undo_mark_task_end();
    }

    layer.dragctx.square.clear();

    layer.dragctx.startx = -1;
    layer.dragctx.starty = -1;
}

// --
// 
// --

function initMainHTMLWindow() {
    document.getElementById("layer0pane").style.maxWidth  = ""+CONFIG.htmlLayerPaneW+"px"; 
    document.getElementById("layer0pane").style.maxHeight = ""+CONFIG.htmlLayerPaneH+"px"; 
    document.getElementById("layer1pane").style.maxWidth  = ""+CONFIG.htmlLayerPaneW+"px"; 
    document.getElementById("layer1pane").style.maxHeight = ""+CONFIG.htmlLayerPaneH+"px"; 
    document.getElementById("layer2pane").style.maxWidth  = ""+CONFIG.htmlLayerPaneW+"px"; 
    document.getElementById("layer2pane").style.maxHeight = ""+CONFIG.htmlLayerPaneH+"px"; 
    document.getElementById("layer3pane").style.maxWidth  = ""+CONFIG.htmlLayerPaneW+"px"; 
    document.getElementById("layer3pane").style.maxHeight = ""+CONFIG.htmlLayerPaneH+"px"; 

    document.getElementById("compositepane").style.maxWidth  = ""+CONFIG.htmlCompositePaneW+"px"; 
    document.getElementById("compositepane").style.maxHeight = ""+CONFIG.htmlCompositePaneH+"px";
}

function initFileLoader() {
    let filecontent = "";

    const fileInput = document.getElementById('input');
    fileInput.onchange = (evt) => {
        if (!window.FileReader) return; // Browser is not compatible

        var reader = new FileReader();

        reader.onload = function (evt) {
            if (evt.target.readyState != 2) return;
            if (evt.target.error) {
                alert('Error while reading file');
                return;
            }

            filecontent = evt.target.result;
            doimport(filecontent).then(mod => loadMapFromModule(mod));
        };

        reader.readAsText(evt.target.files[0]);
    }
}

function initRadios() {
    var rad = document.myForm.radioTiledim;
    var prev = null;
    for (var i = 0; i < rad.length; i++) {
        rad[i].addEventListener('change', function () {
            if (this !== prev) {
                prev = this;
            }
            if (this.value == 16) {
                if (g_context.tileDim == 16) { return; }
                CONFIG.setScreenXTiles(CONFIG.screenxtiles / (this.value / g_context.tileDim));
                CONFIG.setScreenYTiles(CONFIG.screenytiles / (this.value / g_context.tileDim));
                g_context.tileDim = 16;
                g_context.dimlog = Math.log2(g_context.tileDim);
                g_context.curtiles = g_context.tiles16;
                console.log("set to curTiles16");
            } else if (this.value == 32) {
                if (g_context.tileDim == 32) { return; }
                CONFIG.setScreenXTiles(CONFIG.screenxtiles / (this.value / g_context.tileDim));
                CONFIG.setScreenYTiles(CONFIG.screenytiles / (this.value / g_context.tileDim));
                g_context.tileDim = 32;
                g_context.dimlog = Math.log2(g_context.tileDim);
                g_context.curtiles = g_context.tiles32;
                console.log("set to curTiles32");
            } else {
                console.debug("Invalid TileDim!");
            }
            g_layers.map((l) => redrawGrid (l, true) );
            redrawGrid(tileset, true);
            redrawGrid(composite, true);
        });
    }
}

function initTiles() {
    // load tileset into a global array of textures for blitting onto levels
    const bt = PIXI.BaseTexture.from(CONFIG.tilesetpath, {
        scaleMode: PIXI.SCALE_MODES.NEAREST,
    });
    for (let x = 0; x < CONFIG.screenxtiles; x++) {
        for (let y = 0; y < CONFIG.screenytiles; y++) {
            g_context.tiles32[x + y * CONFIG.screenxtiles] = new PIXI.Texture(
                bt,
                new PIXI.Rectangle(x * 32, y * 32, 32, 32),
            );
        }
    }
    for (let x = 0; x < CONFIG.screenxtiles * 2; x++) {
        for (let y = 0; y < CONFIG.screenytiles * 2; y++) {
            g_context.tiles16[x + y * CONFIG.screenxtiles * 2] = new PIXI.Texture(
                bt,
                new PIXI.Rectangle(x * 16, y * 16, 16, 16),
            );
        }
    }

    g_context.curtiles = g_context.tiles32;
}

function init() {
    initMainHTMLWindow();
    initRadios();
    initTiles();
    initFileLoader();
}

init();