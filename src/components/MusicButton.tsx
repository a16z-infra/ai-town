'use client';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEffect, useState } from 'react';

import { sound } from '@pixi/sound';

export default function MusicButton() {
    const music = useQuery(api.music.getBackgroundMusic)

    const [isPlaying, setPlaying] = useState(false);
    const [isLoaded, setLoaded] = useState(false);


    useEffect(() => {
        setLoaded(music === undefined);
    }, [music]);

    if (!isLoaded && music?.url) {
        setLoaded(true)
        sound.add('background', music?.url).loop = true;;
    }

    const flipSwitch = async () => {
        if (isPlaying) {
            sound.stop('background');
        } else {
            sound.play('background');
        }
        setPlaying(!isPlaying);
    };

    return (
        <>
            <a
                className="button text-white shadow-solid text-2xl pointer-events-auto"
                onClick={flipSwitch}
                title="Play AI generated music"
            >
                <div className="inline-block bg-clay-700">
                    <span>
                        <div className="inline-flex items-center gap-4">
                            <img className="w-6 h-6" src="/assets/volume.svg" />
                            {isPlaying ? 'Mute' : 'Play'}
                        </div>
                    </span>
                </div>
            </a>
        </>
    );
}
