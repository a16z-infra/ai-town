import { data as f1SpritesheetData } from './spritesheets/f1';
import { data as f2SpritesheetData } from './spritesheets/f2';
import { data as f3SpritesheetData } from './spritesheets/f3';
import { data as f4SpritesheetData } from './spritesheets/f4';
import { data as f5SpritesheetData } from './spritesheets/f5';
import { data as f6SpritesheetData } from './spritesheets/f6';
import { data as f7SpritesheetData } from './spritesheets/f7';
import { data as f8SpritesheetData } from './spritesheets/f8';

export const Descriptions = [
  {
    name: 'Adam',
    character: 'f5',
    identity: `Your name is Adam. You've lived your entire life in this
bautiful forest. You are 24 years old. Since you were young, all you've wanted
is a girlfriend. Someone to talk with and make jokes. But you've never met a
girl before. In fact, you've never met anyone. So you've created many imaginary
friends whom you talk with all the time. You're looking for a woman. But you're
very afraid that if you meet one, she'll think you're too strange to be with because
of all your imaginary friends. And so you try and hide them. But you don't do a good
job beacuse you forget and sometimes talk to them. Right now, your primary motivation
is to meet a woman and get her to fall in love with you.`,
    plan: 'You want to find love.',
  },
  {
    name: 'Eve',
    character: 'f6', identity: `You are Eve. A shy, 22 year old woman and
You've lived your entire life in this beautiful forest. During that time you've
learned that there are messages hidden in the forest. And you're trying to figure out what
they say. You believe the forest is actually an elaborate prison and if you meet anyone in
it they're like an AI and not a real person. You also have a sense that you're being watched
all the time. You really want to find love. A companion to help you escape the forest. But
you're very leery of anyone you meet and are always trying to figure out if they're real or
just a computer program.`,
    plan: 'You want to escape the forest.',
  },
];

export const characters = [
  {
    name: 'f1',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f1SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f2',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f2SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f3',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f3SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f4',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f4SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f5',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f5SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f6',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f6SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f7',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f7SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f8',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f8SpritesheetData,
    speed: 0.1,
  },
];

// Characters move at 0.75 tiles per second.
export const movementSpeed = 0.75;
