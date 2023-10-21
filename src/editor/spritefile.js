import * as CONFIG from './seconfig.js' 
import * as UTIL from './eutils.js'
import { g_ctx }  from './secontext.js' // global context


function generate_preamble() {
    const preamble = '' +
        '{"frames": {\n' +
        '\n';
       return preamble; 
}

// Function to download data to a file
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

export function generate_sprite_file() {

    let layer0 = g_ctx.g_layers[0];
    console.log("generate_sprite_file");

    let text = generate_preamble();

    let animations = Array.from(Array(CONFIG.leveltileheight), () => new Array().fill(null)); 

    for (let row = 0; row < CONFIG.leveltileheight; row++) {
        if (!layer0.tilearray[row][0]) {
            // FIXME
            // Assume row is empty if first tile is. 
            continue;
        }

        for (let x = 0; x < layer0.tilearray[row].length; x++) {

        //"pixels_large1.png":
        // {
        // 	"frame": {"x":0,"y":192,"w":32,"h":64},
        // 	"rotated": false,
        // 	"trimmed": true,
        // 	"spriteSourceSize": {"x":0,"y":0,"w":32,"h":64},
        // 	"sourceSize": {"w":32,"h":64}
        // },

            let framename = '"tile' + row + "_" + x + '"';

            animations[row].push(framename);
            let frame = layer0.tilearray[row][x];
            text += framename + ": { \n";
            text += '\t"frame": {';
            text += '"x": '+ frame.tspx[0]+ ', "y": '+ frame.tspx[1]+ ', "w": '+ g_ctx.tiledimx+ ', "h": '+ g_ctx.tiledimy+ ' },\n';
            text += '\t"rotated": false,\n';
            text += '\t"trimmed": true,\n';
            text += '\t"spriteSourceSize": {';
            text += '"x":0, "y":0, "w": '+ g_ctx.tiledimx+ ', "h": '+ g_ctx.tiledimy+ ' },\n';
            text += '\t"sourceSize": {';
            text += '"w": '+ g_ctx.tiledimx+ ', "h": '+ g_ctx.tiledimy+ ' }\n';
            text += '\t}';

            text += (x === layer0.tilearray[row].length - 1)?  '\n':',\n'
        }
    }
    text += '},\n';
    text += '"animations": {\n';

    for (let row = 0; row < CONFIG.leveltileheight; row++) {
        if(animations[row].length == 0) {
            continue;
        }
        text += '"row'+row+'" : [';
        for (let x = 0; x < animations[row].length; x++){
            text += ''+animations[row][x];
            if (x < animations[row].length - 1){
                text += ',';
            }
        }
        text += "],\n"
    }

    // remove the trailing comma
    text = text.slice(0,-2);
    text += '\n';


    text += '},\n';
    text += '"meta": {\n';
    text += '\t"image": "'+ g_ctx.tilesetpath+'",\n'
    text += '\t"format": "RGBA8888",\n';
    text += '\t"scale": "1"\n';
    text += '}\n';
    text += '}\n';

    //console.log(text);
    let filename = g_ctx.tilesetpath.split('/').slice(-1)[0];
    filename = filename.split('.')[0];
    console.log("spritefile: saving to file ",filename);
    UTIL.download(text, filename+".json", "text/plain");
}