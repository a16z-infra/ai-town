// --
// Simple level editer. 
//
// TODO: 
//  - <esc> clear selected_tiles
// 
// Done:
//  - Delete tiles
//  - move magic numbers to context / initialization (zIndex, pane size etc.)
//  - todo fudge factor on g_ctx.tileset 
//  - get rid of dangerous CONFIG.tiledim (use g_ctx.tileDim instead)
//  - XXX create tilesetpadding for tilesets whos tiles are spaced (e.g. phantasy star II)
//  - only use fudge to pick sprites rather than fudge and non
//  - use g_ctx for g_ctx.tileset parameters instead of CONFIG (starting with initTilesetConfig) 
//  - todo print locations on screen
//
// 
// Keybindings:
// <ctl>-z - undo
// g - overlay 32x32 grid
// s - generate .js file to move over to convex/maps/
// m - place a semi-transparent red mask over all tiles. This helps find invisible tiles
// d - hold while clicking a tile to delete
// p - toggle between 16pixel and 32 pixel. 
// 
// Known bugs and annoyances
//  - if deleting a tile while filter is on, filter isn't refreshed so need to toggle with "m"
// --

import * as PIXI from 'pixi.js'
import { g_ctx }  from './secontext.js' // global context
import * as CONFIG from './seconfig.js' 
import * as UNDO from './undo.js'
import * as SPRITEFILE from './spritefile.js'
import * as UI from './sehtmlui.js'
import { EventSystem } from '@pixi/events';

g_ctx.debug_flag = true;

function tileset_index_from_coords(x, y) {
    let retme = x + (y*g_ctx.tilesettilew);
    console.log("tileset_index_from_coord ",retme, x, y);
    return retme; 
}
function level_index_from_coords(x, y) {
    // place 16px tiles in separate index space
    let offset = (g_ctx.tiledimx == 16)? CONFIG.MAXTILEINDEX : 0;
    let retme = x + (y*CONFIG.leveltilewidth) + offset; 
    return retme;
}
function tileset_index_from_px(x, y) {
    let coord_x = Math.floor((x - g_ctx.tileset.fudgex) / (g_ctx.tiledimx + CONFIG.tilesetpadding));
    let coord_y = Math.floor((y - g_ctx.tileset.fudgey) / (g_ctx.tiledimy+ CONFIG.tilesetpadding));

    console.log("tileset_index_from_px ",x, y);

    return tileset_index_from_coords(coord_x, coord_y); 
}
function level_index_from_px(x, y) {
    let coord_x = Math.floor(x / g_ctx.tiledimx);
    let coord_y = Math.floor(y / g_ctx.tiledimy);
    return level_index_from_coords(coord_x, coord_y); 
}

function tileset_coords_from_index(index) {
        let x = index % (g_ctx.tilesettilew);
        let y = Math.floor(index / (g_ctx.tilesettilew));
        console.log("tilesettilewidth: ",g_ctx.tilesettilew);
        console.log("tileset_coords_from_index tile coords: ",index,x,y);
        return [x,y];
}

function tileset_px_from_index(index) {
        let ret = tileset_coords_from_index(index); 
        return [ret[0] * (g_ctx.tiledimx+CONFIG.tilesetpadding), ret[1] * (g_ctx.tiledimy+CONFIG.tilesetpadding)] ;
}


// return a sprite of size tileDim given (x,y) starting location
function sprite_from_px(x, y) {

    const bt = PIXI.BaseTexture.from(g_ctx.tilesetpath, {
        scaleMode: PIXI.SCALE_MODES.NEAREST,
    });
    let w = g_ctx.tiledimx;
    let h = g_ctx.tiledimy;
    if(x + w > g_ctx.tilesetpxw) {
        console.log("sprite_from_px: Warning, texture overrun, truncating");
        w = g_ctx.tilesetpxw - x;
    }
    if(y + h > g_ctx.tilesetpxh) {
        console.log("sprite_from_px: Warning, texture overrun, truncating");
        y = g_ctx.tilesetpxh - h;
    }
    let texture = new PIXI.Texture(bt,
                new PIXI.Rectangle(x, y, w, h) 
            );
    return new PIXI.Sprite(texture);
}

function DragState() {
    this.square  = new PIXI.Graphics();
    this.tooltip = new PIXI.Text('', {
        fontFamily: 'Courier',
        fontSize: 12,
        fill: 0xffffff,
        align: 'center',
    });
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
        this.widthpx  = CONFIG.levelwidth;
        this.heightpx = CONFIG.levelheight;


        this.container = new PIXI.Container();
        this.sprites = {};
        this.composite_sprites = {};
        this.dragctx = new DragState();
        this.tilearray = Array.from(Array(CONFIG.leveltileheight), () => new Array().fill(null)); 

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
        this.square.eventMode = 'static';
        this.container.addChild(this.square);

        this.square.on('mousemove', onLevelMousemove.bind(this));
        this.square.on('mouseover', onLevelMouseover.bind(this));
        this.square.on('pointerout', onLevelMouseOut.bind(this))
        this.square.on('pointerdown', onLevelPointerDown.bind(null, this))
            .on('pointerup', onLevelDragEnd.bind(null, this))
            .on('pointerupoutside', onLevelDragEnd.bind(null, this));

        if (mod != null && !(mod === g_ctx)) {
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
                    this.addTileLevelCoords(x, y, mod.DEFAULTILEDIMX, tiles[x][y]);
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
                this.filtergraphics.drawRect(spr.x, spr.y, g_ctx.tiledimx, g_ctx.tiledimy);
            }
            this.filtergraphics.endFill();
            this.container.addChild(this.filtergraphics);
        }else{
            this.filtergraphics.clear();
            this.container.removeChild(this.filtergraphics);
        }

        this.filtertoggle = ! this.filtertoggle;
    }

    // add tile of "index" to Level at location x,y
    addTileLevelCoords(x, y, dim, index) {
        return this.addTileLevelPx(x * dim, y * dim, index);
    }

    // -- delete all sprites / textures on a given index
    // will NOOP if no tile exists
    deleteFromIndex(index) {
        if(g_ctx.debug_flag){
            console.log("deleteFromIndex ",index)
        }
        
        if(this.sprites.hasOwnProperty(index)){
            let ctile = this.sprites[index];
            let row = Math.floor(ctile.y / g_ctx.tiledimy);
            let col = Math.floor(ctile.x / g_ctx.tiledimx);
            for(let x = 0; x < this.tilearray[row].length; x++){
                if(this.tilearray[row][x].x == col * g_ctx.tiledimx){
                    console.log("Removing texture from tilearray ",x,row);
                    this.tilearray[row].splice(x, 1);
                }
            }

            this.container.removeChild(this.sprites[index]);
            delete this.sprites[index];
            this.updateAnimatedTiles();
        }

    }

    // add tile of "index" to Level at location x,y
    addTileLevelPx(x, y, index) {
        let xPx = x;
        let yPx = y;

        let ctile = null;
        let ctile2 = null;

        let pxloc = tileset_px_from_index(index);
        ctile = sprite_from_px(pxloc[0] + g_ctx.tileset.fudgex, pxloc[1] + g_ctx.tileset.fudgey);
        ctile.index = index;

        // snap to grid
        const dx = g_ctx.tiledimx;
        const dy = g_ctx.tiledimy;
        ctile.x = Math.floor(xPx / dx) * dx;
        ctile.y = Math.floor(yPx / dy) * dy;
        // Stuff tileset coords into ctile for writing to ts file
        ctile.tspx = [pxloc[0] + g_ctx.tileset.fudgex, pxloc[1] + g_ctx.tileset.fudgey]; 

        let new_index = level_index_from_px(ctile.x, ctile.y);

        if (g_ctx.debug_flag) {
            console.log('addTileLevelPx ', this.num, ' ctile.x ', ctile.x, 'ctile.y ', ctile.y, "index ", index, "new_index", new_index);
        }

        if (!g_ctx.dkey) {
            this.container.addChild(ctile);
        }

        if (this.sprites.hasOwnProperty(new_index)) {
            this.deleteFromIndex(new_index);
        }

        if (!g_ctx.dkey) {
            this.tilearray[Math.floor(yPx / dy)].push(ctile);
            this.sprites[new_index] = ctile;
        } else if (typeof this.filtergraphics != 'undefined') {
            this.filtergraphics.clear();
            this.drawFilter();
                this.drawFilter(); // do twice to get toggle back to original state
        }

        return new_index;
    }

    // --
    // FIXME : currently just a naive loop. 
    // --
    updateAnimatedTiles() {
        console.log("updateAnimatedTiles");
        for (let row = 0; row < CONFIG.leveltileheight; row++) {
            if (!this.tilearray[row][0]) {
                continue;
            }
            let textures = [];
            for (let x = 0; x < this.tilearray[row].length; x++) {
                textures.push(this.tilearray[row][x].texture);
            }
            const as = new PIXI.AnimatedSprite(textures);
            as.x = row * g_ctx.tiledimx;
            as.y = this.num * g_ctx.tiledimy;
            as.animationSpeed = .1;
            as.autoUpdate = true;
            as.play();
            if (this.tilearray[row].hasOwnProperty('as')){
                g_ctx.composite.container.removeChild(this.tilearray[row].as);
            }
            this.tilearray[row].as = as;
            g_ctx.composite.container.addChild(as);
        }
    }
} // class  LayerContext

class TilesetContext {

    constructor(app, mod = g_ctx) {
        this.app = app;
        this.container = new PIXI.Container();


        console.log(mod.tilesetpath);
        const texture = PIXI.Texture.from(mod.tilesetpath);
        const bg    = new PIXI.Sprite(texture);

        this.widthpx  = g_ctx.tilesetpxw;
        this.heightpx = g_ctx.tilesetpxh;

        this.square = new PIXI.Graphics();
        this.square.beginFill(0x2980b9);
        this.square.drawRect(0, 0, mod.tilesetpxw, mod.tilesetpxh);
        this.square.endFill();
        this.square.eventMode = 'static';
        this.container.addChild(this.square);
        this.container.addChild(bg);
        
        this.app.stage.addChild(this.container);

        this.fudgex = 0; // offset from 0,0
        this.fudgey = 0;

        this.dragctx = new DragState();

        this.square.on('mousedown', function (e) {

            g_ctx.tile_index = tileset_index_from_px(e.global.x, e.global.y); 

            if(g_ctx.debug_flag) {
                console.log("g_ctx.tileset mouse down. index "+g_ctx.tile_index);
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
        this.widthpx  = CONFIG.levelwidth;
        this.heightpx = CONFIG.levelheight;

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
        this.square.eventMode = 'static';
        this.container.addChild(this.square);

        this.square.on('mousedown', onCompositeMousedown.bind(null, this));
    }

} // class CompositeContext


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

function resetPanes() {
    g_ctx.tiledimx = 16;
    g_ctx.tiledimy = 16;

    g_ctx.composite.container.removeChildren();
    g_ctx.composite = new CompositeContext(g_ctx.composite_app);
    g_ctx.tileset_app.stage.removeChildren()
    g_ctx.tileset = new TilesetContext(g_ctx.tileset_app);
    g_ctx.g_layer_apps[0].stage.removeChildren()
    g_ctx.g_layers[0] = new LayerContext(g_ctx.g_layer_apps[0], document.getElementById("layer0pane"), 0);
    g_ctx.g_layer_apps[1].stage.removeChildren()
    g_ctx.g_layers[1] = new LayerContext(g_ctx.g_layer_apps[1], document.getElementById("layer1pane"), 1);
    g_ctx.g_layer_apps[2].stage.removeChildren()
    g_ctx.g_layers[2] = new LayerContext(g_ctx.g_layer_apps[2], document.getElementById("layer2pane"), 2);
    g_ctx.g_layer_apps[3].stage.removeChildren()
    g_ctx.g_layers[3] = new LayerContext(g_ctx.g_layer_apps[3], document.getElementById("layer3pane"), 3);

    redrawGrid();
}

function downloadpng(filename) {
    let newcontainer = new PIXI.Container();
    let children = [...g_ctx.composite.container.children];
    for(let i = 0; i <  children.length; i++) {
        let child = children[i];
        if (! child.hasOwnProperty('isSprite') || !child.isSprite){
            console.log(child);
            continue;
        }
        // console.log(child, typeof child);
        g_ctx.composite.container.removeChild(child);
        newcontainer.addChild(child);
    }
      renderer.plugins.extract.canvas(newcontainer).toBlob(function (b) {
      //renderer.plugins.extract.canvas(g_ctx.composite.container).toBlob(function (b) {
      console.log(b);
      var a = document.createElement("a");
      document.body.append(a);
      a.download = filename;
      a.href = URL.createObjectURL(b);
      a.click();
      a.remove();
    }, "image/png");
  }

window.saveCompositeAsImage = () => {
    downloadpng("g_ctx.composite.png");
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
        map_app.stage.addChild(g_ctx.composite.container);
    }else {
        g_ctx.composite.app.stage.addChild(g_ctx.composite.container);
    }
}

window.addEventListener(
    "keyup", (event) => {
        if (event.code == "KeyD"){
            g_ctx.dkey = false;
            g_ctx.g_layers.map( (l) => l.container.addChild(l.mouseshadow));
            g_ctx.composite.container.addChild(g_ctx.composite.mouseshadow);
        }
    });
window.addEventListener(
    "keydown", (event) => {

        if (event.code == "KeyD"){
            g_ctx.dkey = true;
            g_ctx.g_layers.map((l) => l.container.removeChild(l.mouseshadow) );
            g_ctx.composite.container.removeChild(g_ctx.composite.mouseshadow);
        }

        if (event.code == 'KeyS'){
            SPRITEFILE.generate_sprite_file();
        }
        else if (event.code == 'Escape'){
            g_ctx.selected_tiles = [];
            g_ctx.g_layers.map((l) => l.mouseshadow.removeChildren());
            composite.mouseshadow.removeChildren();
        }
        else if (event.code == 'KeyM'){
            g_ctx.g_layers.map((l) => l.drawFilter () );
        }else if (event.code == 'KeyP'){
            setGridSize((g_ctx.tiledimx == 16)?32:16);
        }
        else if (event.ctrlKey && event.code === 'KeyZ'){
            let undome = UNDO.undo_pop();
            if (!undome) {
                return;
            }
            let layer = undome.shift();
            for(let i = 0; i < undome.length; i++) {
                if (g_ctx.debug_flag) {
                    console.log("Undo removing ", undome[i])
                }
                layer.container.removeChild(layer.sprites[undome[i]]);
                g_ctx.composite.container.removeChild(layer.composite_sprites[undome[i]]);
            }
        }
        else if (event.shiftKey && event.code == 'ArrowUp') {
            g_ctx.tileset.fudgey -= 1;
            redrawGridPane(g_ctx.tileset);
        }
        else if (event.shiftKey && event.code == 'ArrowDown') {
            g_ctx.tileset.fudgey += 1;
            redrawGridPane(g_ctx.tileset);
        }
        else if (event.shiftKey && event.code == 'ArrowLeft') {
            g_ctx.tileset.fudgex -= 1;
            redrawGridPane(g_ctx.tileset);
        }
        else if (event.shiftKey && event.code == 'ArrowRight') {
            g_ctx.tileset.fudgex += 1;
            redrawGridPane(g_ctx.tileset);
        }
     }
  );

// Listen to pointermove on stage once handle is pressed.

function onTilesetDragStart(e)
{
    if (g_ctx.debug_flag) {
        console.log("onDragStartTileset()");
    }
    g_ctx.tileset.app.stage.eventMode = 'static';
    g_ctx.tileset.app.stage.addEventListener('pointermove', onTilesetDrag);
    
    g_ctx.tileset.dragctx.startx = e.global.x;
    g_ctx.tileset.dragctx.starty = e.global.y;
    g_ctx.tileset.dragctx.endx = e.global.x;
    g_ctx.tileset.dragctx.endy = e.global.y;

    g_ctx.tileset.app.stage.addChild(g_ctx.tileset.dragctx.square);
    // g_ctx.tileset.app.stage.addChild(g_ctx.tileset.dragctx.tooltip);

    g_ctx.selected_tiles = [];
}

// Stop dragging feedback once the handle is released.
function onTilesetDragEnd(e)
{
    if (g_ctx.debug_flag) {
        console.log("onDragEndTileset()");
    }
    g_ctx.tileset.app.stage.eventMode = 'auto';
    g_ctx.tileset.app.stage.removeEventListener('pointermove', onTilesetDrag);
    g_ctx.tileset.app.stage.removeChild(g_ctx.tileset.dragctx.square);
    g_ctx.tileset.app.stage.removeChild(g_ctx.tileset.dragctx.tooltip);

    let starttilex = Math.floor((g_ctx.tileset.dragctx.startx - g_ctx.tileset.fudgex) / g_ctx.tiledimx);
    let starttiley = Math.floor((g_ctx.tileset.dragctx.starty - g_ctx.tileset.fudgey) / g_ctx.tiledimy);
    let endtilex = Math.floor((g_ctx.tileset.dragctx.endx - g_ctx.tileset.fudgex) / g_ctx.tiledimx);
    let endtiley = Math.floor((g_ctx.tileset.dragctx.endy - g_ctx.tileset.fudgey) / g_ctx.tiledimy);

    if (g_ctx.debug_flag) {
        console.log("sx sy ex ey ", starttilex, ",", starttiley, ",", endtilex, ",", endtiley);
    }
    // let mouse clicked handle if there isn't a multiple tile square
    if(starttilex === endtilex && starttiley === endtiley ){
        return;
    }

    g_ctx.tile_index = tileset_index_from_px(e.global.x, e.global.y); 

    let origx = starttilex;
    let origy = starttiley;
    for(let y = starttiley; y <= endtiley; y++){
        for(let x = starttilex; x <= endtilex; x++){
            let squareindex = (y * g_ctx.tilesettilew) + x;
            console.log("Pushing into st ", x - origx,y - origy, squareindex);
            g_ctx.selected_tiles.push([x - origx,y - origy,squareindex]);
        }
    }

    // if we're still 16x16 assume we're resizing the grid
    if (g_ctx.tiledimx == 16 && g_ctx.tiledimy == 16) {
        // for sprite tool, we want to set the tilesize based on the selected region
        // FIXME .. don't use magic number 16
        g_ctx.tiledimx = (1 + endtilex - starttilex) * 16;
        g_ctx.tiledimy = (1 + endtiley - starttiley) * 16;
        redrawGrid();
        g_ctx.selected_tiles = [];
        g_ctx.tile_index = tileset_index_from_px(g_ctx.tileset.dragctx.startx - g_ctx.tileset.fudgex, g_ctx.tileset.dragctx.starty - g_ctx.tileset.fudgey);
    }

    g_ctx.tileset.dragctx.square.clear();
    // g_ctx.tileset.dragctx.tooltip.clear();
}

function onTilesetDrag(e)
{
    if (g_ctx.debug_flag) {
        console.log("onDragTileset()");
    }
    g_ctx.tileset.dragctx.endx = e.global.x;
    g_ctx.tileset.dragctx.endy = e.global.y;
    
    g_ctx.tileset.dragctx.square.clear();
    g_ctx.tileset.dragctx.square.beginFill(0xFF3300, 0.3);
    g_ctx.tileset.dragctx.square.lineStyle(2, 0xffd900, 1);
    g_ctx.tileset.dragctx.square.moveTo(g_ctx.tileset.dragctx.startx, g_ctx.tileset.dragctx.starty);
    g_ctx.tileset.dragctx.square.lineTo(g_ctx.tileset.dragctx.endx, g_ctx.tileset.dragctx.starty);
    g_ctx.tileset.dragctx.square.lineTo(g_ctx.tileset.dragctx.endx, g_ctx.tileset.dragctx.endy);
    g_ctx.tileset.dragctx.square.lineTo(g_ctx.tileset.dragctx.startx, g_ctx.tileset.dragctx.endy);
    g_ctx.tileset.dragctx.square.closePath();
    g_ctx.tileset.dragctx.square.endFill();


    // g_ctx.tileset.dragctx.tooltip.clear();
    // g_ctx.tileset.dragctx.tooltip.beginFill(0xFF3300, 0.3);
    // g_ctx.tileset.dragctx.tooltip.lineStyle(2, 0xffd900, 1);
    // g_ctx.tileset.dragctx.tooltip.drawRect(e.global.x, e.global.y, 20,8);
    // g_ctx.tileset.dragctx.tooltip.endFill();
}

//g_ctx.tileset.app.stage.addChild(g_ctx.tileset.container);

function redrawGridPane(pane) {

    if (typeof pane.gridgraphics != 'undefined') {
        pane.container.removeChild(pane.gridgraphics);
    }

    pane.gridgraphics = new PIXI.Graphics();
    let gridsizex = g_ctx.tiledimx;
    let gridsizey = g_ctx.tiledimy;
    pane.gridgraphics.lineStyle(1, 0x000000, 1);


    let index = 0;
    for (let i = 0; i < pane.widthpx; i += gridsizex) {
        pane.gridgraphics.moveTo(i + pane.fudgex, 0 + pane.fudgey);
        pane.gridgraphics.lineTo(i + pane.fudgex, pane.heightpx + pane.fudgey);
        pane.gridgraphics.moveTo(i + gridsizex + pane.fudgex, 0 + pane.fudgey);
        pane.gridgraphics.lineTo(i + gridsizex + pane.fudgex, pane.heightpx + pane.fudgey);

    }
    for (let j = 0; j < pane.heightpx; j += gridsizey) {
        pane.gridgraphics.moveTo(0 + pane.fudgex, j + gridsizey + pane.fudgey);
        pane.gridgraphics.lineTo(pane.widthpx + pane.fudgex, j + gridsizey + pane.fudgey);
        pane.gridgraphics.moveTo(0 + pane.fudgex, j + pane.fudgey);
        pane.gridgraphics.lineTo(pane.heightpx + pane.fudgex, j + pane.fudgey);
    }

    if (pane.gridvisible) {
        pane.container.addChild(pane.gridgraphics);
    }
    pane.container.addChild(pane.gridgraphics);
    pane.gridvisible = true;
}

function redrawGrid() {
    g_ctx.g_layers.map((l) => redrawGridPane(l));
    redrawGridPane(g_ctx.tileset);
    redrawGridPane(g_ctx.composite);
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
    g_ctx.g_layers.map((l) => {
        l.scrollpane.scrollLeft = x - (CONFIG.htmlCompositePaneW/2);
        l.scrollpane.scrollTop  = y - (CONFIG.htmlCompositePaneH/2);
      });
}

function onLevelMouseover(e) {
    let x = e.data.global.x;
    let y = e.data.global.y;
    if(g_ctx.debug_flag){
        console.log("onLevelMouseOver ",this.num);
    }
    if (x < this.scrollpane.scrollLeft || x > this.scrollpane.scrollLeft + CONFIG.htmlCompositePaneW) {
        return;
    }
    if (y < this.scrollpane.scrollTop || y > this.scrollpane.scrollTop + CONFIG.htmlCompositePaneH) {
        return;
    }

    if (this.lasttileindex != g_ctx.tile_index) {
        this.mouseshadow.removeChildren(0);
        g_ctx.composite.mouseshadow.removeChildren(0);
        if (g_ctx.selected_tiles.length == 0) {
            let shadowsprite = null;
            let shadowsprite2 = null;

            let pxloc = tileset_px_from_index(g_ctx.tile_index);
            shadowsprite  = sprite_from_px(pxloc[0] + g_ctx.tileset.fudgex, pxloc[1] + g_ctx.tileset.fudgey);
            shadowsprite2 = sprite_from_px(pxloc[0] + g_ctx.tileset.fudgex, pxloc[1] + g_ctx.tileset.fudgey);

            shadowsprite.alpha = .5;
            shadowsprite2.alpha = .5;
            this.mouseshadow.addChild(shadowsprite);
            g_ctx.composite.mouseshadow.addChild(shadowsprite2);
        } else {
            // TODO! adjust for fudge
            for (let i = 0; i < g_ctx.selected_tiles.length; i++) {
                let tile = g_ctx.selected_tiles[i];
                console.log("TILE", tile);
                let pxloc = tileset_px_from_index(tile[2]);
                console.log('PXLOC',pxloc);


                const shadowsprite  = sprite_from_px(pxloc[0] + g_ctx.tileset.fudgex, pxloc[1] + g_ctx.tileset.fudgey);
                const shadowsprite2 = sprite_from_px(pxloc[0] + g_ctx.tileset.fudgex, pxloc[1] + g_ctx.tileset.fudgey);
                shadowsprite.x = tile[0] * g_ctx.tiledimx;
                shadowsprite.y = tile[1] * g_ctx.tiledimy;
                shadowsprite2.x = tile[0] * g_ctx.tiledimx;
                shadowsprite2.y = tile[1] * g_ctx.tiledimy;
                shadowsprite.alpha = .5;
                shadowsprite2.alpha = .5;
                this.mouseshadow.addChild(shadowsprite);
                g_ctx.composite.mouseshadow.addChild(shadowsprite2);
            }

        }
        this.mouseshadow.x = x - 16;
        this.mouseshadow.y = y - 16;
        this.container.removeChild(this.mouseshadow);
        g_ctx.composite.container.removeChild(g_ctx.composite.mouseshadow);
        this.container.addChild(this.mouseshadow);
        g_ctx.composite.container.addChild(g_ctx.composite.mouseshadow);
    }

    g_ctx.composite.app.stage.removeChild(g_ctx.composite.circle);
    g_ctx.composite.app.stage.addChild(g_ctx.composite.circle);
}


function onLevelMouseOut(e) {
    if (g_ctx.debug_flag) {
        console.log("onLevelMouseOut ",this.num);
    }
    this.mouseshadow.removeChildren(0);
    g_ctx.composite.mouseshadow.removeChildren(0);
}

function onLevelMousemove(e) {
    let x = e.data.global.x;
    let y = e.data.global.y;

    // FIXME TEST CODE
    this.mouseshadow.x = x-8;
    this.mouseshadow.y = y-8;
    g_ctx.composite.mouseshadow.x = x-8;
    g_ctx.composite.mouseshadow.y = y-8;
    // FIXME TEST CODE


    if (x < this.scrollpane.scrollLeft || x > this.scrollpane.scrollLeft + CONFIG.htmlCompositePaneW) {
        return;
    }
    if (y < this.scrollpane.scrollTop || y > this.scrollpane.scrollTop + CONFIG.htmlCompositePaneH) {
        return;
    }

    g_ctx.composite.circle.clear();
    g_ctx.composite.circle.beginFill(0xe50000, 0.5);
    g_ctx.composite.circle.drawCircle(e.data.global.x, e.data.global.y, 3);
    g_ctx.composite.circle.endFill();
}
function onCompositeMousedown(layer, e) {
    if (g_ctx.debug_flag) {
        console.log('onCompositeMouseDown: X', e.data.global.x, 'Y', e.data.global.y);
    }

    let xorig = e.data.global.x;
    let yorig = e.data.global.y;

    centerLayerPanes(xorig,yorig);
}


// Place with no variable target at destination
function levelPlaceNoVariable(layer, e) {
    if (g_ctx.debug_flag) {
        console.log('levelPlaceNoVariable: X', e.data.global.x, 'Y', e.data.global.y);
    }

    let xorig = e.global.x;
    let yorig = e.global.y;

    // No need to center pane
    // centerCompositePane(xorig,yorig);

    if (g_ctx.dkey || g_ctx.selected_tiles.length == 0) {
        let ti = layer.addTileLevelPx(e.global.x, e.global.y, g_ctx.tile_index);
        UNDO.undo_add_single_index_as_task(layer, ti);
    } else {
        let undolist = [];
        UNDO.undo_mark_task_start(layer);
        for (let index of g_ctx.selected_tiles) {
            let ti = layer.addTileLevelPx(xorig + index[0] * g_ctx.tiledimx, yorig + index[1] * g_ctx.tiledimy, index[2]);
            UNDO.undo_add_index_to_task(ti);
        }
        UNDO.undo_mark_task_end();
    }

    layer.updateAnimatedTiles();
}

// Listen to pointermove on stage once handle is pressed.
function onLevelPointerDown(layer, e)
{
    if (g_ctx.debug_flag) {
        console.log("onLevelPointerDown()");
    }
    layer.app.stage.eventMode = 'static';
    layer.app.stage.addEventListener('pointermove', onLevelDrag.bind(null, layer, e));

    layer.container.removeChild(layer.mouseshadow);
    g_ctx.composite.container.removeChild(g_ctx.composite.mouseshadow);

    layer.dragctx.startx = e.data.global.x;
    layer.dragctx.starty = e.data.global.y;
    layer.dragctx.endx = e.data.global.x;
    layer.dragctx.endy = e.data.global.y;

    layer.app.stage.addChild(layer.dragctx.square);
    layer.app.stage.addChild(layer.dragctx.tooltip);
}

function onLevelDrag(layer, e)
{
    if(layer.dragctx.startx == -1){
        layer.dragctx.square.clear();
        return;
    }

    layer.dragctx.endx = e.global.x;
    layer.dragctx.endy = e.global.y;

    if (g_ctx.debug_flag) {
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

    const vwidth  = Math.floor((layer.dragctx.endx - layer.dragctx.startx)/g_ctx.tiledimx);
    const vheight = Math.floor((layer.dragctx.endy - layer.dragctx.starty)/g_ctx.tiledimy);
    layer.dragctx.tooltip.x = e.global.x + 16;
    layer.dragctx.tooltip.y = e.global.y - 4;
    layer.dragctx.tooltip.text = "["+vwidth+","+vheight+"]\n"+
                                 "("+Math.floor(e.global.x/g_ctx.tiledimx)+","+Math.floor(e.global.y/g_ctx.tiledimy)+")";
    //layer.dragctx.tooltip.text = "("+e.global.x+","+e.global.y+")";
}

function onLevelCreateAnimatedSprite(row) {


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
    if (g_ctx.debug_flag) {
        console.log("onLevelDragEnd()");
    }

    layer.container.addChild(layer.mouseshadow);
    g_ctx.composite.container.addChild(g_ctx.composite.mouseshadow);

    layer.app.stage.eventMode = 'auto';
    layer.app.stage.removeChild(layer.dragctx.square);
    layer.app.stage.removeChild(layer.dragctx.tooltip);

    let starttilex = Math.floor(layer.dragctx.startx / g_ctx.tiledimx);
    let starttiley = Math.floor(layer.dragctx.starty / g_ctx.tiledimy);
    let endtilex = Math.floor(layer.dragctx.endx / g_ctx.tiledimx);
    let endtiley = Math.floor(layer.dragctx.endy / g_ctx.tiledimy);

    if (g_ctx.debug_flag) {
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

    if (g_ctx.selected_tiles.length == 0) {
        UNDO.undo_mark_task_start(layer);
        for (let i = starttilex; i <= endtilex; i++) {
            for (let j = starttiley; j <= endtiley; j++) {
                let squareindex = (j * g_ctx.tilesettilew) + i;
                let ti = layer.addTileLevelPx(i * g_ctx.tiledimx, j * g_ctx.tiledimy, g_ctx.tile_index);
                UNDO.undo_add_index_to_task(ti);
            }
        }
        UNDO.undo_mark_task_end();
    } else {
        // figure out selected grid
        let selected_grid = Array.from(Array(64), () => new Array(64)); // FIXME ... hope 64x64 is enough
        let row = 0;
        let column = 0;
        let selected_row = g_ctx.selected_tiles[0][1];
        // selected_grid[0] = [];
        for (let index of g_ctx.selected_tiles) {
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
                let squareindex = (j * g_ctx.tilesettilew) + i;
                if (j === starttiley) { // first row 
                    if (i === starttilex) { // top left corner
                        ti = layer.addTileLevelPx(i * g_ctx.tiledimx, j * g_ctx.tiledimy, selected_grid[0][0][2]);
                    }
                    else if (i == endtilex) { // top right corner
                        ti = layer.addTileLevelPx(i * g_ctx.tiledimx, j * g_ctx.tiledimy, selected_grid[column - 1][0][2]);
                    } else { // top middle
                        ti = layer.addTileLevelPx(i * g_ctx.tiledimx, j * g_ctx.tiledimy, selected_grid[1][0][2]);
                    }
                } else if (j === endtiley) { // last row
                    if (i === starttilex) { // bottom left corner
                        ti = layer.addTileLevelPx(i * g_ctx.tiledimx, j * g_ctx.tiledimy, selected_grid[0][row][2]);
                    }
                    else if (i == endtilex) { // bottom right corner
                        ti = layer.addTileLevelPx(i * g_ctx.tiledimx, j * g_ctx.tiledimy, selected_grid[column - 1][row][2]);
                    } else { // bottom middle
                        ti = layer.addTileLevelPx(i * g_ctx.tiledimx, j * g_ctx.tiledimy, selected_grid[1][row][2]);
                    }
                } else { // middle row
                    if (i === starttilex) { // middle left 
                        ti = layer.addTileLevelPx(i * g_ctx.tiledimx, j * g_ctx.tiledimy, selected_grid[0][(row > 0)? 1 : 0][2]);
                    }
                    else if (i === endtilex) { // middle end 
                        ti = layer.addTileLevelPx(i * g_ctx.tiledimx, j * g_ctx.tiledimy, selected_grid[column - 1][(row > 0)? 1 : 0][2]);
                    } else { // middle middle
                        ti = layer.addTileLevelPx(i * g_ctx.tiledimx, j * g_ctx.tiledimy, selected_grid[1][(row > 0)? 1 : 0][2]);
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
// Initialized all pixi apps / components for application
// --
function initPixiApps() {

    // -- Editor wide globals --

    // First layer of level
    const level_app0 = new PIXI.Application({ backgroundColor: 0x2980b9, width: CONFIG.levelwidth, height: CONFIG.levelheight, view: document.getElementById('level0') });
    let layer0 = new LayerContext(level_app0, document.getElementById("layer0pane"), 0);

    // second layer of level 
    const level_app1 = new PIXI.Application({ backgroundColor: 0x2980b9, width: CONFIG.levelwidth, height: CONFIG.levelheight, view: document.getElementById('level1') });
    let layer1 = new LayerContext(level_app1, document.getElementById("layer1pane"), 1);

    //  object layer of level
    const level_app2 = new PIXI.Application({ backgroundColor: 0x2980b9, width: CONFIG.levelwidth, height: CONFIG.levelheight, view: document.getElementById('level3') });
    let layer2 = new LayerContext(level_app2, document.getElementById("layer2pane"), 2);

    //  object layer of level
    const level_app3 = new PIXI.Application({ backgroundColor: 0x2980b9, width: CONFIG.levelwidth, height: CONFIG.levelheight, view: document.getElementById('level4') });

    let layer3 = new LayerContext(level_app3, document.getElementById("layer3pane"), 3);

    g_ctx.g_layer_apps = [];
    g_ctx.g_layer_apps.push(level_app0 );
    g_ctx.g_layer_apps.push(level_app1);
    g_ctx.g_layer_apps.push(level_app2);
    g_ctx.g_layer_apps.push(level_app3);


    g_ctx.g_layers = [];
    g_ctx.g_layers.push(layer0);
    g_ctx.g_layers.push(layer1);
    g_ctx.g_layers.push(layer2);
    g_ctx.g_layers.push(layer3);

    // g_ctx.composite view 
    g_ctx.composite_app = new PIXI.Application({ backgroundAlpha: 0, width: CONFIG.levelwidth, height: CONFIG.levelheight, view: document.getElementById('composite') });
    g_ctx.composite = new CompositeContext(g_ctx.composite_app);

    //  map tab 
    g_ctx.map_app = new PIXI.Application({ backgroundColor: 0x2980b9, width: CONFIG.levelwidth, height: CONFIG.levelheight, view: document.getElementById('mapcanvas') });

    // g_ctx.tileset
    // g_ctx.tileset_app = new PIXI.Application({ width: g_ctx.tilesetpxw, height: g_ctx.tilesetpxh, view: document.getElementById('tileset') });
    g_ctx.tileset_app = new PIXI.Application({ width: 5632 , height: 8672, view: document.getElementById('tileset') });
    //g_ctx.tileset_app = new PIXI.Application({ backgroundColor: 0x2980b9, width: 5632 , height: 8672, view: document.getElementById('tileset') });

    const { renderer } = g_ctx.tileset_app;
    // Install the EventSystem
    renderer.addSystem(EventSystem, 'tileevents');
    g_ctx.tileset = new TilesetContext(g_ctx.tileset_app);
}

// --
// Initialize handlers for file loading
// --

function initLevelLoader() {
    let filecontent = "";

    const fileInput = document.getElementById('levelfile');
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


function setGridSize(size) {
    if (size == 16) {
        if (g_ctx.tiledimx == 16) { return; }
        g_ctx.tilesettilew = (g_ctx.tilesettilew/ (size / g_ctx.tiledimx));
        g_ctx.tilesettileh = (g_ctx.tilesettileh / (size / g_ctx.tiledimy));
        g_ctx.tiledimx = 16;
        g_ctx.dimlog = Math.log2(g_ctx.tiledimx);
        g_ctx.curtiles = g_ctx.tiles16;
        console.log("set to curTiles16");
    } else if (size == 32) {
        if (g_ctx.tiledimx == 32) { return; }
        g_ctx.tilesettilew = (g_ctx.tilesettilew/ (size / g_ctx.tiledimx));
        g_ctx.tilesettileh = (g_ctx.tilesettileh / (size / g_ctx.tiledimy));
        g_ctx.tiledimx = 32;
        g_ctx.dimlog = Math.log2(g_ctx.tiledimx);
        g_ctx.curtiles = g_ctx.tiles32;
        console.log("set to curTiles32");
    } else {
        console.debug("Invalid TileDim!");
        return;
    }
    redrawGrid();
}

function initRadios() {
    var rad = document.myForm.radioTiledim;
    var prev = null;
    for (var i = 0; i < rad.length; i++) {
        rad[i].addEventListener('change', function () {
            if (this !== prev) {
                prev = this;
            }
            setGridSize(this.value);
        });
    }
}

// --
// Load in default tileset and use to set properties
// --
const initTilesConfig = async (path = CONFIG.DEFAULTTILESETPATH) => {

    g_ctx.tilesetpath = path; 

    return new Promise((resolve, reject) => {
        
    const texture = new PIXI.BaseTexture(g_ctx.tilesetpath);

    console.log("Loading texture ",g_ctx.tilesetpath);
    texture .on('loaded', function() {
        // size of g_ctx.tileset in px
        g_ctx.tilesetpxw = texture.width;
        g_ctx.tilesetpxh = texture.height;
        console.log("Texture size w:", g_ctx.tilesetpxw, "h:", g_ctx.tilesetpxh);
        // size of g_ctx.tileset in tiles
        let tileandpad = g_ctx.tiledimx + CONFIG.tilesetpadding;
        let numtilesandpadw = Math.floor(g_ctx.tilesetpxw / tileandpad);
        g_ctx.tilesettilew = numtilesandpadw + Math.floor((g_ctx.tilesetpxw - (numtilesandpadw * tileandpad))/g_ctx.tiledimx);
        let numtilesandpadh = Math.floor(g_ctx.tilesetpxh / tileandpad);
        g_ctx.tilesettileh = numtilesandpadh + Math.floor((g_ctx.tilesetpxh - (numtilesandpadh * tileandpad))/g_ctx.tiledimy);
        console.log("Number of x tiles ",g_ctx.tilesettilew," y tiles ",g_ctx.tilesettileh);

        g_ctx.MAXTILEINDEX = g_ctx.tilesettilew * g_ctx.tilesettileh;

        texture.destroy();
        resolve();
    });

  
      });
  };

function initTiles() {
    // load g_ctx.tileset into a global array of textures for blitting onto levels
    const bt = PIXI.BaseTexture.from(g_ctx.tilesetpath, {
        scaleMode: PIXI.SCALE_MODES.NEAREST,
    });
    for (let x = 0; x < CONFIG.tilesettilewidth; x++) {
        for (let y = 0; y < CONFIG.tilesettileheight; y++) {
            g_ctx.tiles32[x + y * CONFIG.tilesettilewidth] = new PIXI.Texture(
                bt,
                new PIXI.Rectangle(x * 32, y * 32, 32, 32),
            );
        }
    }
    for (let x = 0; x < CONFIG.tilesettilewidth * 2; x++) {
        for (let y = 0; y < CONFIG.tilesettileheight * 2; y++) {
            g_ctx.tiles16[x + y * CONFIG.tilesettilewidth * 2] = new PIXI.Texture(
                bt,
                new PIXI.Rectangle(x * 16, y * 16, 16, 16),
            );
        }
    }

    g_ctx.curtiles = g_ctx.tiles32;
}

function newTilesetFromFile(){

    initTilesConfig(g_ctx.tilesetpath).then(resetPanes);
}

async function init() {

    UI.initMainHTMLWindow();
    await initTilesConfig(); // needs to be called before Pixi apps are initialized

    initPixiApps();
    initRadios();
    initTiles();
    initLevelLoader();
    UI.initCompositePNGLoader();
    UI.initTilesetLoader(newTilesetFromFile); 

    redrawGrid();
}

init();