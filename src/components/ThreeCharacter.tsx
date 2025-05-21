import * as THREE from 'three';
import React, { useMemo } from 'react'; // react-three-fiber might not be used, but React is for structure

export interface CharacterData {
  id: string;
  position: { x: number; y: number; z: number };
  type: 'player' | 'npc' | 'monster';
  name?: string;
}

interface ThreeCharacterProps {
  characterData: CharacterData;
}

// This component will create and return a THREE.Mesh object.
// It's not a traditional React component that renders DOM elements,
// but a factory for Three.js objects.
export const createCharacterMesh = (data: CharacterData): THREE.Mesh => {
  let geometry: THREE.BufferGeometry;
  let material: THREE.Material;
  const characterHeightOffset = 0.5; // Assuming position.y is ground level for capsule base

  switch (data.type) {
    case 'player':
      // CapsuleGeometry: radius, height, capSegments, radialSegments
      geometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 10); // Adjusted radius and height
      material = new THREE.MeshStandardMaterial({ color: 0x007bff }); // Blue
      geometry.translate(0, 0.4, 0); // Translate geometry so its base is at origin before positioning
      break;
    case 'npc':
      geometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 10);
      material = new THREE.MeshStandardMaterial({ color: 0x28a745 }); // Green
      geometry.translate(0, 0.4, 0); 
      break;
    case 'monster':
      geometry = new THREE.SphereGeometry(0.4, 16, 12); // Adjusted radius
      material = new THREE.MeshStandardMaterial({ color: 0xdc3545 }); // Red
      // Sphere origin is its center, so if position.y is ground, translate by radius
      geometry.translate(0, 0.4, 0);
      break;
    default:
      // Default to a simple box if type is unknown
      geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      material = new THREE.MeshStandardMaterial({ color: 0x6c757d }); // Grey
      geometry.translate(0, 0.25, 0);
      break;
  }

  const mesh = new THREE.Mesh(geometry, material);
  // Position is set where this mesh is added to the scene.
  // The geometry translation ensures the base of the character is at data.position.y
  mesh.position.set(data.position.x, data.position.y, data.position.z);
  mesh.name = data.name || data.id; // For identification in the scene graph

  return mesh;
};

// If we were to use this as a <ThreeCharacter characterData={...} /> component with react-three-fiber:
/*
const ThreeCharacter: React.FC<ThreeCharacterProps> = ({ characterData }) => {
  const mesh = useMemo(() => createCharacterMesh(characterData), [characterData]);
  return <primitive object={mesh} />;
};
export default ThreeCharacter;
*/

// For now, we'll use createCharacterMesh directly in ThreeScene.tsx
export {}; // To make this a module
