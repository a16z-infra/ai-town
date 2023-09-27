import clsx from 'clsx';
import { useMutation, useQuery } from 'convex/react';
import { KeyboardEvent, useRef, useState } from 'react';
import { api } from '../../convex/_generated/api';
import { Doc, Id } from '../../convex/_generated/dataModel';
import { toastOnError } from '../toasts';

export function MessageInput({
  humanPlayer,
  conversation,
}: {
  humanPlayer: Doc<'players'>;
  conversation: Doc<'conversations'>;
}) {
  const inputRef = useRef<HTMLParagraphElement>(null);
  const [inflight, setInflight] = useState(0);
  const writeMessage = useMutation(api.messages.writeMessage);
  const startTyping = useMutation(api.messages.startTyping);
  const currentlyTyping = useQuery(api.messages.currentlyTyping, {
    conversationId: conversation._id,
  });

  const onKeyDown = async (e: KeyboardEvent) => {
    e.stopPropagation();
    // Send the current message.
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!inputRef.current) {
        return;
      }
      const text = inputRef.current.innerText;
      inputRef.current.innerText = '';
      await writeMessage({
        playerId: humanPlayer._id,
        conversationId: conversation._id,
        text,
      });
      return;
    }
    // Try to set a typing indicator.
    else {
      if (currentlyTyping || inflight > 0) {
        return;
      }
      setInflight((i) => i + 1);
      try {
        // Don't show a toast on error.
        startTyping({
          playerId: humanPlayer._id,
          conversationId: conversation._id,
        });
      } finally {
        setInflight((i) => i - 1);
      }
    }
  };
  return (
    <div className="leading-tight mb-6">
      <div className="flex gap-4">
        <span className="uppercase flex-grow">{humanPlayer.name}</span>
      </div>
      <div className={clsx('bubble', 'bubble-mine')}>
        <p
          className="bg-white -mx-3 -my-1"
          ref={inputRef}
          contentEditable
          style={{ outline: 'none' }}
          tabIndex={0}
          placeholder="Type here"
          onKeyDown={(e) => onKeyDown(e)}
        />
      </div>
    </div>
  );
}
