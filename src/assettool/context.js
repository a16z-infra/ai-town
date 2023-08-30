import * as PIXI from 'pixi.js'

var ContextCreate = (function(){

    function ContextSingleton() {
        this.tile_index = 0;
        this.selected_tiles = [];
        this.tileDim = 32; // px
        this.dimlog = Math.log2(this.tileDim); 
        this.dkey = false;
    }

    var instance;
    return {
        getInstance: function(){
            if (instance == null) {
                instance = new ContextSingleton();
                // Hide the constructor so the returned object can't be new'd...
                instance.constructor = null;
            }
            return instance;
        }
   };
})();

// global shared state between all panes
export let g_context = ContextCreate.getInstance();