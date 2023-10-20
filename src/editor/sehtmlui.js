import * as PIXI from 'pixi.js'
import { g_ctx }  from './secontext.js' // global context
import * as CONFIG from './seconfig.js' 

// --
//  Set sizes and limits for HTML in main UI
// --

export function initMainHTMLWindow() {
    document.getElementById("layer0pane").style.maxWidth  = ""+CONFIG.htmlLayerPaneW+"px"; 
    document.getElementById("layer0pane").style.maxHeight = ""+CONFIG.htmlLayerPaneH+"px"; 
    document.getElementById("layer1pane").style.maxWidth  = ""+CONFIG.htmlLayerPaneW+"px"; 
    document.getElementById("layer1pane").style.maxHeight = ""+CONFIG.htmlLayerPaneH+"px"; 
    document.getElementById("layer2pane").style.maxWidth  = ""+CONFIG.htmlLayerPaneW+"px"; 
    document.getElementById("layer2pane").style.maxHeight = ""+CONFIG.htmlLayerPaneH+"px"; 
    document.getElementById("layer3pane").style.maxWidth  = ""+CONFIG.htmlLayerPaneW+"px"; 
    document.getElementById("layer3pane").style.maxHeight = ""+CONFIG.htmlLayerPaneH+"px"; 

    document.getElementById("tilesetpane").style.maxWidth  = ""+CONFIG.htmlTilesetPaneW+"px"; 
    document.getElementById("tilesetpane").style.maxHeight = ""+CONFIG.htmlTilesetPaneH+"px";
    document.getElementById("compositepane").style.maxWidth  = ""+CONFIG.htmlCompositePaneW+"px"; 
    document.getElementById("compositepane").style.maxHeight = ""+CONFIG.htmlCompositePaneH+"px";

    // hide map tab
    let mappane = document.getElementById("map");
    mappane.style.display = "none";
}

// --
// Initialize handlers loading a PNG file into the composite window 
// --

export function initCompositePNGLoader() {
    const fileInput = document.getElementById('compositepng');
    fileInput.onchange = (evt) => {
        if (!window.FileReader) return; // Browser is not compatible
        if (g_ctx.debug_flag) {
            console.log("compositepng ", fileInput.files[0].name);
        }
        let bgname = fileInput.files[0].name;

        const texture = PIXI.Texture.from("./"+bgname);
        const bg      = new PIXI.Sprite(texture);
        bg.zIndex = 0;
        g_ctx.composite.container.addChild(bg);
    }
}
// -- 
// initailized handler to load a new tileset 
// --

export function initTilesetLoader(callme) {
    const fileInput = document.getElementById('tilesetfile');
    fileInput.onchange = async (evt) => {
        if (!window.FileReader) return; // Browser is not compatible
        if (g_ctx.debug_flag) {
            console.log("spritesheet ", fileInput.files[0].name);
        }
        g_ctx.tilesetpath =  "./spritesheets/"+fileInput.files[0].name;

        g_ctx.tiledimx = 16;
        g_ctx.tiledimy = 16;

        callme();
    }
}
