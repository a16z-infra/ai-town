import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react'
import Modal from "react-modal";

import GameWrapper from './components/GameWrapper.tsx'
import MusicButton from './components/MusicButton.tsx'
import InteractButton, { randomSpritesheet } from './components/InteractButton.tsx'
import LoginButton from './components/LoginButton.tsx';

import a16zImg from "../assets/a16z.png";
import convexImg from "../assets/convex.svg";
import starImg from "../assets/star.svg";
import helpImg from "../assets/help.svg";
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { MAX_HUMANS } from '../convex/waitlist_constants.ts';

const modalStyles = {
  overlay: {
    backgroundColor: "rgb(0, 0, 0, 75%)",
    zIndex: 12,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: "50%",

    border: '10px solid rgb(23, 20, 33)',
    borderRadius: "0",
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
  },
};

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const worldState = useQuery(api.players.getWorld, {});
  const waitlistStatus = useQuery(api.players.waitlistStatus, worldState ? { worldId: worldState.world._id } : "skip");
  const { user } = useUser();
  const createCharacter = useMutation(api.players.createCharacter);
  const createPlayer = useMutation(api.players.createPlayer);
  useEffect(() => {
    if (!waitlistStatus || waitlistStatus.ticketNumber === null || !user) {
      return;
    }
    const create = async () => {
      const characterId = await createCharacter({
        name: "user",
        spritesheetData: randomSpritesheet(),
      });
      await createPlayer({
        forUser: true,
        name: user.firstName ?? "Me",
        characterId,
        pose: {
          position: {x: 1, y: 1},
          orientation: 1,
        },
      });
    }
    if (user && waitlistStatus.firstTicket! === waitlistStatus.ticketNumber) {
      void create();
    }
  }, [waitlistStatus, createCharacter, createPlayer, user])

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between font-body game-background">
      <Modal
        isOpen={helpModalOpen}
        onRequestClose={() => setHelpModalOpen(false)}
        style={modalStyles}
        contentLabel="Help modal"
        ariaHideApp={false}
      >
        <div className="font-body">
          <h1 className="text-center text-6xl font-bold font-display game-title">Help</h1>
          <p>
            Welcome to AI town. AI town supports both anonymous <i>spectators</i> and logged in <i>interactivity</i>.
          </p>
          <h2 className="text-4xl mt-4">Spectating</h2>
          <p>
            Click and drag to move around the town, and scroll in and out to zoom.
            You can click on an individual character to view its chat history.
          </p>
          <h2 className="text-4xl mt-4">Interactivity</h2>
          <p>
            If you log in, you can join the simulation and directly talk to different agents! After logging in, click the
            "Interact" button, and your character will appear in the top-left of the map.
          </p>
          <p className="text-2xl mt-2">
            Controls:
          </p>
          <ul>
            <li>W, ⬆️: Move up</li>
            <li>A, ⬅️: Move left</li>
            <li>S, ⬇️: Move down</li>
            <li>D, ➡️: Move right</li>
          </ul>
          <p className="mt-4">
            To talk to an agent, click on them and then click "Start conversation," which will ask them to start walking towards you.
            Once they're nearby, the conversation will start, and you can speak to each other. You can leave at any time by closing
            the conversation pane or moving away.
          </p>
          <p className="mt-4">
            AI town only supports {MAX_HUMANS} humans at a time. If other humans are waiting, each human session is limited to five minutes.
          </p>
        </div>
      </Modal>

      <div className="p-6 absolute top-0 right-0 z-10 text-2xl">
        <SignedIn>
          <UserButton afterSignOutUrl="/ai-town" />
        </SignedIn>

        <SignedOut>
          <LoginButton />
        </SignedOut>
      </div>

      <div className="w-full min-h-screen relative isolate overflow-hidden p-6 lg:p-8 shadow-2xl flex flex-col justify-center">
        <h1 className="mx-auto text-center text-6xl sm:text-8xl lg:text-9xl font-bold font-display leading-none tracking-wide game-title">
          AI Town
        </h1>

        <p className="mx-auto my-4 text-center text-xl sm:text-2xl text-white leading-tight shadow-solid">
          A virtual town where AI characters live, chat and socialize.<br />
          Log in to join the town and the conversation!
        </p>

        <GameWrapper />

        <footer className="absolute bottom-0 left-0 w-full flex items-center mt-4 gap-3 p-6 flex-wrap pointer-events-none">
          <div className="flex gap-4 flex-grow pointer-events-none">
            <MusicButton />
            <a
              className="button text-white shadow-solid text-2xl pointer-events-auto"
              href="https://github.com/get-convex/ai-town"
            >
              <div className="inline-block bg-clay-700">
                <span>
                  <div className="inline-flex h-full items-center gap-4">
                    <img className="w-[30px] h-[30px]" src={starImg} />
                    Star
                  </div>
                </span>
              </div>
            </a>
            <InteractButton waitlistStatus={waitlistStatus} />
            <a
              className="button text-white shadow-solid text-2xl pointer-events-auto"
              onClick={() => setHelpModalOpen(true)}
            >
              <div className="inline-block bg-clay-700">
                <span>
                  <div className="inline-flex h-full items-center gap-4">
                    <img className="w-[30px] h-[30px]" src={helpImg} />
                    Help
                  </div>
                </span>
              </div>
            </a>
          </div>
          <a href="https://a16z.com">
            <img className="w-8 h-8 pointer-events-auto" src={a16zImg} alt="a16z" />
          </a>
          <a href="https://convex.dev">
            <img className="w-20 h-8 pointer-events-auto" src={convexImg} alt="Convex" />
          </a>
        </footer>
      </div>
    </main>
  )
}
