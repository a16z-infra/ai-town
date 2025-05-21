import React, { useCallback, useEffect, useState } from 'react';
import volumeImg from '../../../assets/volume.svg';
// import { sound } from '@pixi/sound'; // Removed Pixi Sound
import Button from './Button';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// Placeholder for a new audio solution if needed
const mockSound = {
  add: (id: string, url: string) => ({ loop: false, id, url }),
  play: async (id: string) => console.log(`Mock play sound: ${id}`),
  stop: (id: string) => console.log(`Mock stop sound: ${id}`),
};

export default function MusicButton() {
  const musicUrl = useQuery(api.music.getBackgroundMusic);
  const [isPlaying, setPlaying] = useState(false);

  useEffect(() => {
    if (musicUrl) {
      mockSound.add('background', musicUrl).loop = true; // Using mockSound
      console.log('Music URL loaded:', musicUrl);
    }
  }, [musicUrl]);

  const flipSwitch = async () => {
    if (isPlaying) {
      mockSound.stop('background'); // Using mockSound
    } else {
      await mockSound.play('background'); // Using mockSound
    }
    setPlaying(!isPlaying);
  };

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => { // Changed to KeyboardEvent for better type safety
      if (event.key === 'm' || event.key === 'M') {
        void flipSwitch();
      }
    },
    [flipSwitch, isPlaying], // Added isPlaying to dependencies as flipSwitch depends on it.
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <>
      <Button
        onClick={() => void flipSwitch()}
        className="hidden lg:block"
        title="Play AI generated music (press m to play/mute)"
        imgUrl={volumeImg}
      >
        {isPlaying ? 'Mute' : 'Music'}
      </Button>
    </>
  );
}
