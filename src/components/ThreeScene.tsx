import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { createCharacterMesh, CharacterData } from './ThreeCharacter'; // Import character utils

interface ThreeSceneProps {
  width: number;
  height: number;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ width, height }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [tilemapData, setTilemapData] = useState<any>(null);
  const [tilesetTexture, setTilesetTexture] = useState<THREE.Texture | null>(null);
  const [tilemapAssets, setTilemapAssets] = useState<THREE.Group | null>(null);
  const [characterGroup, setCharacterGroup] = useState<THREE.Group | null>(null); // For character meshes

  // Mock character data
  const mockCharacters: CharacterData[] = [
    { id: 'player1', position: { x: 0, y: 0, z: 0 }, type: 'player', name: 'Hero' },
    { id: 'npc1', position: { x: 2, y: 0, z: 2 }, type: 'npc', name: 'Guide' },
    { id: 'monster1', position: { x: -3, y: 0, z: -3 }, type: 'monster', name: 'Goblin' },
    { id: 'player2', position: { x: 5, y: 0, z: -2 }, type: 'player', name: 'Sidekick' },
  ];

  // 1. Load Assets
  useEffect(() => {
    const loadAssets = async () => {
      try {
        // Load tilemap.json
        const mapResponse = await fetch('/assets/tilemap.json');
        if (!mapResponse.ok) throw new Error(`Failed to fetch tilemap.json: ${mapResponse.statusText}`);
        const mapData = await mapResponse.json();
        setTilemapData(mapData);

        // Load rpg-tileset.png
        const textureLoader = new THREE.TextureLoader();
        const texture = await textureLoader.loadAsync('/assets/rpg-tileset.png');
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        setTilesetTexture(texture);
      } catch (error) {
        console.error('Error loading assets:', error);
      }
    };
    void loadAssets();
  }, []);

  // 2. Process Tilemap Data & Create 3D Geometry
  useEffect(() => {
    if (!tilemapData || !tilesetTexture || !width || !height) return;

    const scene = new THREE.Scene(); // Temporary scene for building assets, or use main scene directly
    scene.background = new THREE.Color(0x7ab5ff); // Set background color

    const newTilemapAssets = new THREE.Group();

    const tileWidth = tilemapData.tilewidth; // e.g. 16
    const tileHeight = tilemapData.tileheight; // e.g. 16
    const mapWidthInTiles = tilemapData.width; // e.g. 40
    const mapHeightInTiles = tilemapData.height; // e.g. 40

    const tileset = tilemapData.tilesets[0];
    const firstGid = tileset.firstgid; // e.g. 1
    const tilesetColumns = tileset.columns; // e.g. 100
    const tilesetRows = Math.ceil(tileset.tilecount / tilesetColumns); // Calculate rows

    const tileProperties: { [id: number]: any } = {};
    if (tileset.tiles) {
      for (const tileProp of tileset.tiles) {
        tileProperties[tileProp.id] = tileProp.properties?.reduce((acc: any, prop: any) => {
          acc[prop.name] = prop.value;
          return acc;
        }, {});
      }
    }
    
    const collisionGroup = new THREE.Group();
    collisionGroup.name = "CollisionGroup";

    // Helper to create collision box
    const createCollisionBox = (x: number, y: number, z: number) => {
        const collisionGeo = new THREE.BoxGeometry(1, 1, 1);
        const collisionMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true, color: 0xff0000 });
        const collisionMesh = new THREE.Mesh(collisionGeo, collisionMat);
        collisionMesh.position.set(x, y, z);
        collisionGroup.add(collisionMesh);
    };

    // Process Layers
    tilemapData.layers.forEach((layer: any) => {
      if (layer.type === 'tilelayer') {
        const layerGroup = new THREE.Group();
        layerGroup.name = layer.name;

        for (let r = 0; r < mapHeightInTiles; r++) {
          for (let c = 0; c < mapWidthInTiles; c++) {
            const tileGid = layer.data[r * mapWidthInTiles + c];
            if (tileGid === 0) continue;

            const tileIndexInTileset = tileGid - firstGid;
            if (tileIndexInTileset < 0) continue;


            const tileX = c - mapWidthInTiles / 2 + 0.5;
            const tileZ = r - mapHeightInTiles / 2 + 0.5;
            
            const hasCollision = tileProperties[tileIndexInTileset]?.collides === true;

            if (layer.name === 'terrain') {
              const planeGeo = new THREE.PlaneGeometry(1, 1);
              const texture = tilesetTexture.clone(); // Clone texture for unique offsets
              texture.needsUpdate = true; // Important for cloned textures

              const uvX = (tileIndexInTileset % tilesetColumns) / tilesetColumns;
              const uvY = 1.0 - ((Math.floor(tileIndexInTileset / tilesetColumns) + 1) / tilesetRows);
              
              texture.offset.set(uvX, uvY);
              texture.repeat.set(1 / tilesetColumns, 1 / tilesetRows);

              const material = new THREE.MeshStandardMaterial({ map: texture });
              const mesh = new THREE.Mesh(planeGeo, material);
              mesh.rotation.x = -Math.PI / 2; // Rotate plane to be horizontal
              mesh.position.set(tileX, 0, tileZ);
              layerGroup.add(mesh);
              if (hasCollision) createCollisionBox(tileX, 0.5, tileZ);

            } else if (layer.name === 'deco') {
              const boxGeo = new THREE.BoxGeometry(1, 1, 1);
              // For BoxGeometry, UV mapping from a spritesheet is complex.
              // Simplification: Use one material for all faces, showing the same tile.
              const texture = tilesetTexture.clone();
              texture.needsUpdate = true;

              const uvX = (tileIndexInTileset % tilesetColumns) / tilesetColumns;
              const uvY = 1.0 - ((Math.floor(tileIndexInTileset / tilesetColumns) + 1) / tilesetRows);
              
              texture.offset.set(uvX, uvY);
              texture.repeat.set(1 / tilesetColumns, 1 / tilesetRows);

              const materials = [];
              for (let i = 0; i < 6; i++) {
                materials.push(new THREE.MeshStandardMaterial({ map: texture }));
              }
              const mesh = new THREE.Mesh(boxGeo, materials);
              mesh.position.set(tileX, 0.5, tileZ);
              layerGroup.add(mesh);
              if (hasCollision) createCollisionBox(tileX, 0.5, tileZ);
            }
          }
        }
        newTilemapAssets.add(layerGroup);
      }
    });
    newTilemapAssets.add(collisionGroup);
    setTilemapAssets(newTilemapAssets);

    return () => {
      // Cleanup THREE resources
      newTilemapAssets.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => {
              mat.map?.dispose();
              mat.dispose();
            });
          } else {
            object.material.map?.dispose();
            object.material.dispose();
          }
        }
      });
      setTilemapAssets(null); // Clear assets from state
    };
  }, [tilemapData, tilesetTexture, width, height]); // Re-run if these change


  // 3. Create Character Meshes
  useEffect(() => {
    // This effect creates the character meshes once mockCharacters are defined.
    // It doesn't depend on tilemapData or tilesetTexture.
    const newCharacterGroup = new THREE.Group();
    newCharacterGroup.name = "CharacterGroup";

    mockCharacters.forEach(charData => {
      const charMesh = createCharacterMesh(charData);
      newCharacterGroup.add(charMesh);
    });
    setCharacterGroup(newCharacterGroup);

    return () => {
      newCharacterGroup.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      newCharacterGroup.clear(); // Remove all children
      setCharacterGroup(null);
    };
    // mockCharacters is stable, so this runs once. If it were dynamic, add it to dependencies.
  }, []); 


  // 4. Setup Scene, Camera, Renderer, and Render Loop
  useEffect(() => {
    if (!mountRef.current || !width || !height ) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ab5ff);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
     // Position camera to see a 40x40 grid (approx)
    camera.position.set(10, 25, 25); // Adjust as needed
    camera.lookAt(0, 0, 0);


    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Brighter ambient
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(15, 20, 10);
    directionalLight.castShadow = true; // Optional: for shadows later
    scene.add(directionalLight);

    // Add loaded tilemap assets to the scene
    if (tilemapAssets) {
      scene.add(tilemapAssets);
    } else {
      // Placeholder if assets not loaded yet (optional)
      // const placeholderGeo = new THREE.BoxGeometry(1,1,1);
      // const placeholderMat = new THREE.MeshBasicMaterial({color: 0xcccccc});
      // const placeholderMesh = new THREE.Mesh(placeholderGeo, placeholderMat);
      // scene.add(placeholderMesh);
      // console.log("Tilemap assets not ready, showing placeholder or nothing for map.");
    }

    // Add character group to the scene
    if (characterGroup) {
      scene.add(characterGroup);
    }

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      // Any animations or updates would go here
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    // Call handleResize initially and on window resize
    handleResize(); 
    // window.addEventListener('resize', handleResize); // Consider if needed globally

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (currentMount) {
         currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Scene assets (tilemapAssets and characterGroup children) are cleaned up in their own useEffects
      ambientLight.dispose();
      directionalLight.dispose();
      // If placeholderMesh was used and needs disposal:
      // placeholderGeo?.dispose();
      // placeholderMat?.dispose();
    };
  }, [width, height, tilemapAssets, characterGroup]); // Re-run if these main asset groups change

  return <div ref={mountRef} style={{ width, height, backgroundColor: '#333' }} />;
};

export default ThreeScene;
