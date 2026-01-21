import clsx from 'clsx';
import { useMutation, useQuery } from 'convex/react';
import { type KeyboardEvent, useRef } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useSendInput } from '../hooks/sendInput';
import type { Player } from '../../convex/aiTown/player';
import type { Conversation } from '../../convex/aiTown/conversation';

export function MessageInput({
  worldId,
  engineId,
  humanPlayer,
  conversation,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  humanPlayer: Player;
  conversation: Conversation;
}) {
  // API types may not be generated - functions exist at runtime
  const descriptions = useQuery((api as any).world?.gameDescriptions, { worldId });
  const humanName = descriptions?.playerDescriptions.find((p: any) => p.playerId === humanPlayer.id)
    ?.name;
  const inputRef = useRef<HTMLDivElement>(null);
  const inflightUuid = useRef<string | undefined>();
  const writeMessage = useMutation((api as any).messages?.writeMessage);
  const startTyping = useSendInput(engineId, 'startTyping');
  const currentlyTyping = conversation.isTyping;

  const onKeyDown = async (e: KeyboardEvent) => {
    e.stopPropagation();

    // Set the typing indicator if we're not submitting.
    if (e.key !== 'Enter') {
      console.log(inflightUuid.current);
      if (currentlyTyping || inflightUuid.current !== undefined) {
        return;
      }
      inflightUuid.current = crypto.randomUUID();
      try {
        // Don't show a toast on error.
        await startTyping({
          playerId: humanPlayer.id,
          conversationId: conversation.id,
          messageUuid: inflightUuid.current,
        });
      } finally {
        inflightUuid.current = undefined;
      }
      return;
    }

    // Send the current message.
    e.preventDefault();
    if (!inputRef.current) {
      return;
    }
    const text = inputRef.current.innerText;
    inputRef.current.innerText = '';
    if (!text) {
      return;
    }
    let messageUuid = inflightUuid.current;
    if (currentlyTyping && currentlyTyping.playerId === humanPlayer.id) {
      messageUuid = currentlyTyping.messageUuid;
    }
    messageUuid = messageUuid || crypto.randomUUID();
    await writeMessage({
      worldId,
      playerId: humanPlayer.id,
      conversationId: conversation.id,
      text,
      messageUuid,
    });
  };
  return (
    <div className="leading-tight mb-6">
      <div className="flex gap-4">
        <span className="uppercase flex-grow">{humanName}</span>
      </div>
      <div className={clsx('bubble', 'bubble-mine')}>
        {/* contentEditable div is intentionally used for rich text editing */}
        <div
          className="bg-white -mx-3 -my-1"
          ref={inputRef}
          contentEditable
          suppressContentEditableWarning
          style={{ outline: 'none' }}
          data-placeholder="Type here"
          onKeyDown={(e) => onKeyDown(e)}
          aria-label="Message input"
          tabIndex={0}
        />
      </div>
    </div>
  );
}
