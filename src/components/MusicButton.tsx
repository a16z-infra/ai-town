import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useCallback, useEffect, useState } from 'react';
import volumeImg from "../../assets/volume.svg";

import { sound } from '@pixi/sound';

export default function MusicButton() {
  const music = useQuery(api.music.getBackgroundMusic);

  const [isPlaying, setPlaying] = useState(false);
  const [isLoaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(music === undefined);
  }, [music]);
  useEffect(() => {
    if (!isLoaded && music?.url) {
      setLoaded(true);
      sound.add('background', music.url).loop = true;
    }
  }, [isLoaded, music])

  const flipSwitch = async () => {
    if (isPlaying) {
      sound.stop('background');
    } else {
      await sound.play('background');
    }
    setPlaying(!isPlaying);
  };

  const handleKeyPress = useCallback(
    (event: { key: string }) => {
      if (event.key === 'm' || event.key === 'M') {
        void flipSwitch();
      }
    },
    [flipSwitch],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <>
      <a
        className="button text-white shadow-solid text-2xl pointer-events-auto cursor-pointer"
        onClick={() => {
          void flipSwitch();
        }}
        title="Play AI generated music (press m to play/mute)"
      >
        <div className="inline-block h-full bg-clay-700">
          <span>
            <div className="inline-flex items-center gap-4">
              <img className="w-6 h-6" src={volumeImg} />
              {isPlaying ? 'Mute' : 'Music'}
            </div>
          </span>
        </div>
      </a>
    </>
  );
}
