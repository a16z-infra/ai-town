
import mapConfig from "../data/maps/mapConfig.js"
import * as gentle from "../data/maps/gentle.js";
import * as serene from "../data/maps/serene.js";
import * as mage3 from "../data/maps/mage3.js";


const mapFiles: Record<string, any> = {
  gentle,
  serene,
  mage3,
};

export function loadAvailableMaps() {
  return mapConfig;
}
export async function loadSelectedMapData(id:string){
  const mapConfigObj = loadAvailableMaps();
  const selectedMap=mapConfigObj.availableMaps.find(m=>m.id===id);
  if(!selectedMap){
    throw new Error(`Map ${id} is not available in map configuration`);
  }
  try{
    const mapdata=mapFiles[id];

    // if(!mapdata.mapwidth||!mapdata.mapheight||!mapdata.tiledim||!mapdata.tilesetpath||!mapdata.tilesetpxw||!mapdata.tilesetpxh||!mapdata.bgtiles||!mapdata.objmap||mapdata.animatedsprites){
    //     throw new Error(`Map ${id} is missing required properties`)
    // }

    return mapdata;
  }catch(error){
    throw new Error(`Failed to load map data for {id}: ${error.message}`)
  }
}
