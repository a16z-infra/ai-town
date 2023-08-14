'use client';

// Some hacky sound code for fun. The 'use client' is to avoid this failing
// during SSR.
import { sound } from '@pixi/sound';
import { PropsWithChildren } from 'react';

sound.add('background', 'assets/background.mp3');
let isPlaying = false;
const keyDownEvent = (event: React.KeyboardEvent<HTMLDivElement>) => {
  if (event.code === 'KeyM') {
    if (!isPlaying) {
      sound.play('background');
      isPlaying = true;
    } else {
      sound.stop('background');
      isPlaying = false;
    }
  }
};

export default ({ children }: PropsWithChildren) => {
  return (
    <div onKeyDown={keyDownEvent} tabIndex={0}>
      {children}
    </div>
  );
};
