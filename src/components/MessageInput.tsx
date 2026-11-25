import clsx from 'clsx';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'react-toastify';
import { KeyboardEvent, useRef, useState } from 'react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useSendInput } from '../hooks/sendInput';
import { Player } from '../../convex/aiTown/player';
import { Conversation } from '../../convex/aiTown/conversation';

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
  const descriptions = useQuery(api.world.gameDescriptions, { worldId });
  const humanName = descriptions?.playerDescriptions.find(
    (p) => p.playerId === humanPlayer.id,
  )?.name;
  const inputRef = useRef<HTMLParagraphElement>(null);
  const draftUuid = useRef<string>();
  const typingRequest = useRef<string>();
  const lastAttemptText = useRef<string>();
  const sending = useRef(false);
  const [isSending, setIsSending] = useState(false);
  const writeMessage = useMutation(api.messages.writeMessage);
  const startTyping = useSendInput(engineId, 'startTyping');
  const currentlyTyping = conversation.isTyping;

  const onKeyDown = async (e: KeyboardEvent) => {
    e.stopPropagation();

    if (e.key !== 'Enter') return;
    e.preventDefault();
    const input = inputRef.current;
    if (sending.current || !input?.innerText) return;

    const messageUuid = (draftUuid.current ??= crypto.randomUUID());
    lastAttemptText.current = input.innerText;
    sending.current = true;
    setIsSending(true);
    try {
      await writeMessage({
        worldId,
        playerId: humanPlayer.id,
        conversationId: conversation.id,
        text: input.innerText,
        messageUuid,
      });
      input.innerText = '';
      lastAttemptText.current = undefined;
      draftUuid.current = undefined;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Message could not be sent');
    } finally {
      sending.current = false;
      setIsSending(false);
    }
  };

  const onInput = async () => {
    if (
      lastAttemptText.current !== undefined &&
      lastAttemptText.current !== inputRef.current?.innerText
    ) {
      // An edited submission is a new message. An unchanged retry keeps its UUID.
      draftUuid.current = undefined;
      lastAttemptText.current = undefined;
    }
    const messageUuid = (draftUuid.current ??= crypto.randomUUID());
    if (currentlyTyping || typingRequest.current === messageUuid) return;
    typingRequest.current = messageUuid;
    try {
      await startTyping({ playerId: humanPlayer.id, conversationId: conversation.id, messageUuid });
    } catch {
      // Typing is advisory. The other speaker may have acquired it first.
    } finally {
      if (typingRequest.current === messageUuid) typingRequest.current = undefined;
    }
  };
  return (
    <div className="leading-tight mb-6">
      <div className="flex gap-4">
        <span className="uppercase flex-grow">{humanName}</span>
      </div>
      <div className={clsx('bubble', 'bubble-mine')}>
        <p
          className="bg-white -mx-3 -my-1"
          ref={inputRef}
          contentEditable={!isSending}
          onInput={onInput}
          style={{ outline: 'none' }}
          tabIndex={0}
          placeholder="Type here"
          onKeyDown={(e) => onKeyDown(e)}
        />
      </div>
    </div>
  );
}
