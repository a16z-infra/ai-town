// POI (Point of Interest) definitions for Stanford Town.
// Map is 64x48 tiles. POIs define logical areas agents navigate to.

export interface Poi {
  id: string;
  name: string;
  type: 'home' | 'restaurant' | 'square' | 'park' | 'library' | 'welfare' | 'gathering';
  area: { x1: number; y1: number; x2: number; y2: number };
  recover?: { hunger?: number; energy?: number };
  // Gathering POIs produce resources
  gatherResource?: string; // 'wood' | 'ore' | 'herbs' | 'food'
  gatherAmount?: number;
}

// POI coordinates aligned with actual buildings on the gentle.js map.
// Building clusters were identified by scanning objmap for non-empty tiles.
export const POIS: Poi[] = [
  {
    id: 'home_a',
    name: 'House A',
    type: 'home',
    // Top-left building cluster (0,0)-(9,9)
    area: { x1: 2, y1: 2, x2: 8, y2: 8 },
    recover: { energy: 60 },
  },
  {
    id: 'home_b',
    name: 'House B',
    type: 'home',
    // Bottom-left building cluster (0,35)-(9,44)
    area: { x1: 2, y1: 36, x2: 8, y2: 42 },
    recover: { energy: 60 },
  },
  {
    id: 'home_c',
    name: 'House C',
    type: 'home',
    // Top-right building cluster (39,0)-(46,6)
    area: { x1: 40, y1: 1, x2: 45, y2: 5 },
    recover: { energy: 60 },
  },
  {
    id: 'restaurant',
    name: 'Town Restaurant',
    type: 'restaurant',
    // Center-top building cluster (31,1)-(38,10)
    area: { x1: 32, y1: 2, x2: 37, y2: 9 },
    recover: { hunger: 50 },
  },
  {
    id: 'square',
    name: 'Town Square',
    type: 'square',
    // Center building cluster (23,20)-(32,29)
    area: { x1: 24, y1: 21, x2: 31, y2: 28 },
  },
  {
    id: 'welfare_office',
    name: 'Welfare Office',
    type: 'welfare',
    // Right-side building cluster (45,32)-(47,38)
    area: { x1: 45, y1: 33, x2: 47, y2: 37 },
  },
  {
    id: 'park',
    name: 'Town Park',
    type: 'park',
    // Open green area bottom-center
    area: { x1: 15, y1: 35, x2: 25, y2: 42 },
  },
  {
    id: 'forest',
    name: 'Forest',
    type: 'gathering',
    // Left edge wooded area
    area: { x1: 1, y1: 15, x2: 8, y2: 25 },
    gatherResource: 'wood',
    gatherAmount: 3,
  },
  {
    id: 'herb_garden',
    name: 'Herb Garden',
    type: 'gathering',
    // Near bottom-right
    area: { x1: 50, y1: 38, x2: 58, y2: 44 },
    gatherResource: 'herbs',
    gatherAmount: 2,
  },
];

export function getPoiById(id: string): Poi | undefined {
  return POIS.find((p) => p.id === id);
}

export function getPoisByType(type: Poi['type']): Poi[] {
  return POIS.filter((p) => p.type === type);
}

export function pickPointInPoi(poi: Poi): { x: number; y: number } {
  const { x1, y1, x2, y2 } = poi.area;
  const x = x1 + Math.floor(Math.random() * (x2 - x1));
  const y = y1 + Math.floor(Math.random() * (y2 - y1));
  return { x, y };
}
