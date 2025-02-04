interface Map{
  id:string;
  name:string;
  description:string;
  mapUrl:string;
  thumbnail: string;
}

interface MapConfig{
  availableMaps:Map[];
  defaultMap:string;
}

const mapConfig:MapConfig = {
  availableMaps: [
    {
      "id": "gentle",
      "name": "gentle village",
      "description": "Tucked between soft green hills and shining rivers, Whispering Willow Village is a quiet, happy place where all the agents live. Cozy cottages sit by winding paths, and big windmills spin gently in the breeze. Cool waterfalls splash into clear ponds, and warm campfires glow as friends share stories under the stars. Fireflies twinkle at night, and the willow trees sway like they’re whispering secrets. It’s a peaceful place to rest before the next big adventure!",
      "mapUrl": "./gentle.js",
      "thumbnail": "/assets/thumbnails/gentleThum.png"
    },
    {
      "id": "serene",
      "name": "green landscape",
      "description": "Soft hills, quiet rivers, and glowing lanterns make Moonveil Haven a peaceful place. The wind sings through the trees, and cherry blossoms float in the air. Water trickles gently, and fireflies sparkle at night. It’s a place to rest, dream, and feel safe under the shining moon.",
      "mapUrl": "./serene.js",
      "thumbnail": "/assets/thumbnails/sereneThum.png"
    },
    {
      "id": "mage3",
      "name": "Arcane Spire ",
      "description": "High above the clouds, Arcane Spire is a magical tower full of secrets! Glowing runes light up the walls, and books float through the air. Friendly wizards and magical creatures live here, learning new spells and mixing potions. Hidden doors, enchanted gardens, and sparkling lights make it a place of wonder. But only the bravest adventurers can discover all its mysteries! ",
      "mapUrl": "./mage3.js",
      "thumbnail": "/assets/thumbnails/mage3Thum.png"
    }
  ],
  defaultMap: "gentle"
}

export default mapConfig; 