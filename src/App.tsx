import Game from './components/Game.tsx';

import { ToastContainer } from 'react-toastify';
import a16zImg from '../assets/a16z.png';
import convexImg from '../assets/convex.svg';
import starImg from '../assets/star.svg';
import helpImg from '../assets/help.svg';
// import { UserButton } from '@clerk/clerk-react';
// import { Authenticated, Unauthenticated } from 'convex/react';
// import LoginButton from './components/buttons/LoginButton.tsx';
import { useState } from 'react';
import ReactModal from 'react-modal';
import MusicButton from './components/buttons/MusicButton.tsx';
import Button from './components/buttons/Button.tsx';
import FreezeButton from './components/FreezeButton.tsx';
import { MAX_HUMAN_PLAYERS } from '../convex/constants.ts';
import NavButton from './components/buttons/NavButton';
import ActionButton from './components/buttons/ActionButton.tsx';
import LeaderboardTable from './components/LeaderboardTable.tsx';
import RoadmapCard from './components/RoadmapCard.tsx';
import bushSprite from '../assets/bush_sprite.png';
import spritesExample from '../assets/sprites_example.png';

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-between font-body game-background w-full">
        <ReactModal
          isOpen={helpModalOpen}
          onRequestClose={() => setHelpModalOpen(false)}
          style={modalStyles}
          contentLabel="Help modal"
          ariaHideApp={false}
        >
          <div className="font-body">
            <h1 className="text-center text-6xl font-bold font-display game-title">Help</h1>
            <p>
              Welcome to AI town. AI town supports both anonymous <i>spectators</i> and logged in{' '}
              <i>interactivity</i>.
            </p>
            <h2 className="text-4xl mt-4">Spectating</h2>
            <p>
              Click and drag to move around the town, and scroll in and out to zoom. You can click
              on an individual character to view its chat history.
            </p>
            <h2 className="text-4xl mt-4">Interactivity</h2>
            <p>
              If you log in, you can join the simulation and directly talk to different agents!
              After logging in, click the "Interact" button, and your character will appear
              somewhere on the map with a highlighted circle underneath you.
            </p>
            <p className="text-2xl mt-2">Controls:</p>
            <p className="mt-4">Click to navigate around.</p>
            <p className="mt-4">
              To talk to an agent, click on them and then click "Start conversation," which will ask
              them to start walking towards you. Once they're nearby, the conversation will start,
              and you can speak to each other. You can leave at any time by closing the conversation
              pane or moving away. They may propose a conversation to you - you'll see a button to
              accept in the messages panel.
            </p>
            <p className="mt-4">
              AI town only supports {MAX_HUMAN_PLAYERS} humans at a time. If you're idle for five
              minutes, you'll be automatically removed from the simulation.
            </p>
          </div>
        </ReactModal>
        {/*<div className="p-3 absolute top-0 right-0 z-10 text-2xl">
          <Authenticated>
            <UserButton afterSignOutUrl="/" />
          </Authenticated>

          <Unauthenticated>
            <LoginButton />
          </Unauthenticated>
        </div> */}

        <div className="w-full lg:h-screen min-h-screen relative isolate overflow-hidden lg:p-8 shadow-2xl flex flex-col justify-start">
          <div className="text-center">
            <nav className="flex justify-center gap-8 mb-12">
              <NavButton to="/">HOME</NavButton>
              <NavButton to="/create">CREATE</NavButton>
              <NavButton to="/game-design">GAME DESIGN</NavButton>
              <NavButton to="/road-map">ROAD MAP</NavButton>
            </nav>

            <div className="mt-16">
              <h2 className="font-display text-xl sm:text-2xl mb-2" style={{ color: '#eeff99' }}>
                Welcome to
              </h2>
              <h1
                className="mx-auto text-2xl p-2 sm:text-5xl lg:text-6xl font-bold font-display leading-none tracking-wide w-full text-left sm:text-center sm:w-auto"
                style={{ color: '#eeff99' }}
              >
                Solana Town
              </h1>
            </div>
          </div>

          <div className="max-w-xs md:max-w-xl lg:max-w-none mx-auto my-4 text-center text-base sm:text-lg md:text-xl text-white leading-tight shadow-solid">
            <div className="mb-4">IN A DISTANT LAND FAR FAR AWAY.</div>
            <div>A VIRTUAL TOWN WHERE AI CHARACTERS LIVE, CHAT AND SOCIALIZE.</div>
          </div>

          <Game />

          <footer className="justify-end bottom-0 left-0 w-full flex items-center mt-4 gap-3 p-6 flex-wrap pointer-events-none">
            <div className="flex gap-4 flex-grow pointer-events-none">
              <MusicButton />

              <Button imgUrl={helpImg} onClick={() => setHelpModalOpen(true)}>
                Help
              </Button>
            </div>
          </footer>
          <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
        </div>
      </div>

      <div className="w-full rest-background">
        <section className="w-full flex flex-col items-center pt-48 pb-32">
          <div className="flex flex-col lg:flex-row items-center justify-between max-w-7xl w-full gap-12 px-8">
            <div className="lg:w-1/2">
              <img src={spritesExample} alt="Character Sprites" className="w-full object-contain" />
            </div>

            <div className="lg:w-1/2 text-white">
              <h2 className="font-display text-4xl sm:text-6xl mb-8" style={{ color: '#eeff99' }}>
                YOUR
                <br />
                CHARACTER
              </h2>
              <p className="text-xl mb-8 max-w-md">
                PICK YOUR HERO AND HAVE
                <br />
                THEM ENGAGE WITH OTHER AI
                <br />
                CHARACTERS IN OUR SOLANA
                <br />
                TOWN.
              </p>
              <ActionButton>Start</ActionButton>
            </div>
          </div>
        </section>

        <section className="w-full flex flex-col items-center py-32">
          <h2 className="font-display text-6xl mb-16" style={{ color: '#eeff99' }}>
            SOLANA CITIZENS
          </h2>
          <LeaderboardTable />
        </section>

        <section className="w-full flex flex-col items-center py-32">
          <div className="flex items-end gap-12 mb-12">
            <div className="w-32 flex items-center justify-start -mt-12">
              <img src={bushSprite} alt="Bush" className="w-32 h-32 object-contain brightness-90" />
            </div>
            <div>
              <h2 className="font-display text-6xl mb-2" style={{ color: '#eeff99' }}>
                ROADMAP
              </h2>
              <p className="text-white font-display text-xl">WHERE ARE WE GOING?</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 max-w-7xl w-full px-8">
            <div className="max-w-lg">
              <RoadmapCard
                phase="PHASE ONE"
                title="Create On-Chain AI Creatures"
                items={[
                  "Upload two photos of your choice. It doesn't have to be animals but would be great if one of them is.",
                  'Our generative AI model will create a hybrid of the two in pixelated art expression.',
                ]}
              />
            </div>
            <div className="max-w-lg">
              <RoadmapCard
                phase="PHASE ONE"
                title="Create On-Chain AI Creatures"
                items={[
                  "Upload two photos of your choice. It doesn't have to be animals but would be great if one of them is.",
                  'Our generative AI model will create a hybrid of the two in pixelated art expression.',
                ]}
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

const modalStyles = {
  overlay: {
    backgroundColor: 'rgb(0, 0, 0, 75%)',
    zIndex: 12,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '50%',

    border: '10px solid rgb(23, 20, 33)',
    borderRadius: '0',
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
  },
};
