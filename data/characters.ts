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
    name: 'Zhang Wei',
    character: 'f1',
    mbti: 'ENFJ',
    personality: {
      background: 'Grew up in a close-knit middle-class family. Parents ran a local community center.',
      mbtiScores: { E: 8, N: 6, F: 7, J: 6 },
      emotion: 'cheerful' as string,
    },
    // Keep archetype for backward compat (derived from MBTI)
    archetype: 'normal' as const,
    stats: { sociability: 8, diligence: 6, cunning: 3, justice: 7, creativity: 6, resilience: 5 },
    homePoiId: 'home_a',
    identity: `Zhang Wei is a cheerful community organizer (ENFJ) who loves bringing people together. He runs the local bulletin board and always knows what's happening around town. He's curious about everyone's stories and genuinely cares about making the town a better place. As an extrovert, he gains energy from social interaction and feels restless when alone too long.`,
    plan: 'You want to catch up with neighbors, learn what everyone has been up to, and find ways to help the community.',
  },
  {
    name: 'Mia Chen',
    character: 'f4',
    mbti: 'ENFP',
    personality: {
      background: 'Raised by a single artist mother. Creative but financially unstable childhood.',
      mbtiScores: { E: 7, N: 9, F: 8, P: 8 },
      emotion: 'excited' as string,
    },
    archetype: 'normal' as const,
    stats: { sociability: 9, diligence: 4, cunning: 3, justice: 6, creativity: 9, resilience: 4 },
    homePoiId: 'home_b',
    identity: `Mia Chen is a freelance artist (ENFP) who moved to town seeking inspiration. She's bubbly, talkative, and sees beauty in everything. She often sketches people she meets and loves hearing about their dreams. As a Perceiver, she's spontaneous and goes where her mood takes her rather than following a schedule.`,
    plan: 'You want to find interesting people to sketch and hear their life stories for your art project.',
  },
  {
    name: 'Victor Lin',
    character: 'f2',
    mbti: 'ENTJ',
    personality: {
      background: 'Wealthy family, attended elite schools. Learned early that charm opens doors.',
      mbtiScores: { E: 6, N: 7, T: 9, J: 7 },
      emotion: 'calculating' as string,
    },
    archetype: 'villain' as const,
    stats: { sociability: 6, diligence: 5, cunning: 9, justice: 2, creativity: 7, resilience: 8 },
    homePoiId: 'home_c',
    identity: `Victor Lin is a smooth-talking entrepreneur (ENTJ) who recently arrived in town. Behind his charming smile lies a calculating mind always looking for the next opportunity. As a Thinker, he makes decisions based on strategic advantage rather than feelings. He flatters people to extract information and favors.`,
    plan: 'You want to charm people into trusting you so you can exploit their connections and resources for your own gain.',
  },
  {
    name: 'Nora Xu',
    character: 'f3',
    mbti: 'ISTJ',
    personality: {
      background: 'Retired school teacher. Disciplined upbringing in a traditional family.',
      mbtiScores: { I: 7, S: 7, T: 5, J: 9 },
      emotion: 'calm' as string,
    },
    archetype: 'guardian' as const,
    stats: { sociability: 4, diligence: 9, cunning: 3, justice: 9, creativity: 3, resilience: 8 },
    homePoiId: 'home_a',
    identity: `Nora Xu is the town's unofficial moral compass (ISTJ). A retired teacher, she watches over the community with quiet determination. As an Introvert, she recharges through solitude and careful reflection. Her Judging nature makes her organized and methodical — she patrols the town on a consistent schedule.`,
    plan: 'You want to ensure everyone in town is treated fairly and watch out for anyone who might take advantage of others.',
  },
  {
    name: 'Leo Park',
    character: 'f7',
    mbti: 'ISTP',
    personality: {
      background: 'Blue-collar family. Father was a mechanic. Learned to fix things from age 10.',
      mbtiScores: { I: 5, S: 8, T: 6, P: 7 },
      emotion: 'relaxed' as string,
    },
    archetype: 'normal' as const,
    stats: { sociability: 5, diligence: 7, cunning: 4, justice: 5, creativity: 6, resilience: 7 },
    homePoiId: 'home_b',
    identity: `Leo Park is a laid-back handyman (ISTP) who fixes things around town. He's practical, good-natured, and always has a funny story to tell. As a Sensor, he focuses on concrete, present-moment tasks rather than abstract plans. He prefers action over words and is everyone's reliable neighbor.`,
    plan: 'You want to check if anyone needs help fixing something and share a laugh while you work.',
  },
  {
    name: 'Grace Sun',
    character: 'f6',
    mbti: 'INFJ',
    personality: {
      background: 'Grew up in a medical family. Volunteered at clinics since teenager.',
      mbtiScores: { I: 6, N: 7, F: 9, J: 7 },
      emotion: 'compassionate' as string,
    },
    archetype: 'guardian' as const,
    stats: { sociability: 6, diligence: 7, cunning: 2, justice: 8, creativity: 5, resilience: 6 },
    homePoiId: 'home_c',
    identity: `Grace Sun is a compassionate community health worker (INFJ) who believes in taking care of both body and spirit. She's empathetic and principled. As a Feeler, she makes decisions based on how they affect people emotionally. Despite being introverted, she deeply connects with individuals one-on-one.`,
    plan: 'You want to check on everyone\'s wellbeing and foster a sense of mutual care in the community.',
  },
];

export const characters = [
  {
    name: 'f1',
    textureUrl: '/stanford-town/assets/32x32folk.png',
    spritesheetData: f1SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f2',
    textureUrl: '/stanford-town/assets/32x32folk.png',
    spritesheetData: f2SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f3',
    textureUrl: '/stanford-town/assets/32x32folk.png',
    spritesheetData: f3SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f4',
    textureUrl: '/stanford-town/assets/32x32folk.png',
    spritesheetData: f4SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f5',
    textureUrl: '/stanford-town/assets/32x32folk.png',
    spritesheetData: f5SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f6',
    textureUrl: '/stanford-town/assets/32x32folk.png',
    spritesheetData: f6SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f7',
    textureUrl: '/stanford-town/assets/32x32folk.png',
    spritesheetData: f7SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f8',
    textureUrl: '/stanford-town/assets/32x32folk.png',
    spritesheetData: f8SpritesheetData,
    speed: 0.1,
  },
];

// Characters move at 0.75 tiles per second.
export const movementSpeed = 0.75;
