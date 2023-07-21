'use client';

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { FirstLevel } from '../../../game/src/scenes/FirstLevel';
import { SecondLevel } from '../../../game/src/scenes/SecondLevel';
import { Preloader } from '../../../game/src/scenes/Preloader';
import { GameManager } from '../../../game/src/scenes/GameManager';
import { HUD } from '../../../game/src/scenes/HUD';

const PhaserGame = () => {
  const gameContainerRef = useRef(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: 600,
        height: 250,
        zoom: 2.5,
        pixelArt: true,
        physics: {
          default: 'arcade',
          // arcade: {
          //   debug: true,
          // },
        },
        scene: [Preloader, FirstLevel, SecondLevel, GameManager, HUD],
      };

      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);
};

export default PhaserGame;
