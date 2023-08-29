import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useCallback, useEffect, useState } from 'react';

import { sound } from '@pixi/sound';
import { convertNextStaticUrl } from './util';

export default function MusicButton() {
  const music = useQuery(api.music.getBackgroundMusic);

  const [isPlaying, setPlaying] = useState(false);
  const [isLoaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(music === undefined);
  }, [music]);

  if (!isLoaded && music?.url) {
    setLoaded(true);
    sound.add('background', convertNextStaticUrl(music?.url)).loop = true;
  }

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
        className="button text-white shadow-solid text-2xl pointer-events-auto"
        onClick={() => {
          void flipSwitch();
        }}
        title="Play AI generated music (press m to play/mute)"
      >
        <div className="inline-block bg-clay-700">
          <span>
            <div className="inline-flex items-center gap-4">
              <img className="w-6 h-6" src="/assets/volume.svg" />
              {isPlaying ? 'Mute' : 'Music'}
            </div>
          </span>
        </div>
      </a>
    </>
  );
}
