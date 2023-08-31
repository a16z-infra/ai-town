import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

import GameWrapper from './components/GameWrapper.tsx'
import MusicButton from './components/MusicButton.tsx'
import LoginButton from './components/LoginButton.tsx';

import a16zImg from "../assets/a16z.png";
import convexImg from "../assets/convex.svg";
import starImg from "../assets/star.svg";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between font-body game-background">
      <div className="p-6 absolute top-0 right-0 z-10 text-2xl">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
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
          A virtual town where AI characters live, chat and socialize.
        </p>

        <GameWrapper />

        <footer className="absolute bottom-0 left-0 w-full flex items-center mt-4 gap-3 p-6 flex-wrap pointer-events-none">
        <div className="flex gap-4 flex-grow pointer-events-none">
        <MusicButton />
        <a
              className="button text-white shadow-solid text-2xl pointer-events-auto"
              href="https://github.com/convex-dev/ai-town"
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
