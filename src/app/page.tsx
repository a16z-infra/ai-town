import { UserButton } from '@clerk/nextjs';
import Examples from '@/components/Examples';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between font-body game-background">
      <div className="p-6 absolute top-0 right-0 z-10">
        <UserButton afterSignOutUrl="/" />
      </div>

      <div className="w-full min-h-screen relative isolate overflow-hidden p-6 lg:p-8 shadow-2xl flex flex-col justify-center">
        <h1 className="mx-auto text-center text-6xl sm:text-8xl lg:text-9xl font-bold font-display leading-none tracking-wide game-title">
          AI Town
        </h1>

        <p className="mx-auto my-4 text-center text-xl sm:text-2xl text-white leading-tight shadow-solid">
          A virtual town where AI characters live, chat and socialize.
        </p>

        <Examples />

        <div className="h-16"></div>

        <footer className="absolute bottom-0 right-0 flex justify-end mt-4 gap-6 p-6">
          <a href="https://a16z.com">
            <img className="w-14 h-14" src="/a16z.png" alt="a16z" />
          </a>
          <a href="https://convex.dev">
            <img
              className="w-14 h-14"
              style={{ imageRendering: 'pixelated' }}
              src="/convex.png"
              alt="Convex"
            />
          </a>
        </footer>
      </div>
    </main>
  );
}
