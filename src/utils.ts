import { GameObjects } from 'phaser';
import { AbstractScene } from './scenes/AbstractScene';
import { Monster } from './game-objects/Monster';

const TEXT_VERTICAL_SHIFT = 10;

export function debounce(func, delay) {
  let timerId;

  return function(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

export async function converse(scene: AbstractScene, fromNPC: string, toNPC: string) {
  //TODO - update this when we figure out how monster.name is updated

  const response = await fetch('http://localhost:3000/api/converse', {
    method: 'POST',
    body: JSON.stringify({ characters: [fromNPC, toNPC] }),
  });
  const data = await response.json();
  console.log(data);
  return data;
}
