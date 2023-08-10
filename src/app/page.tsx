import { UserButton, auth } from '@clerk/nextjs';
import Examples from '@/components/Examples';
import LoginButton from '@/components/LoginButton';

export default function Home() {
  const { userId } = auth();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between font-body game-background">
      <div className="p-6 absolute top-0 right-0 z-10 text-2xl">
        {userId ? <UserButton afterSignOutUrl="/" /> : <LoginButton />}
      </div>

      <div className="w-full min-h-screen relative isolate overflow-hidden p-6 lg:p-8 shadow-2xl flex flex-col justify-center">
        <h1 className="mx-auto text-center text-6xl sm:text-8xl lg:text-9xl font-bold font-display leading-none tracking-wide game-title">
          AI Town
        </h1>

        <p className="mx-auto my-4 text-center text-xl sm:text-2xl text-white leading-tight shadow-solid">
          A virtual town where AI characters live, chat and socialize.
        </p>

        <Examples />

        <footer className="absolute bottom-0 left-0 w-full flex items-center mt-4 gap-6 p-6 flex-wrap">
          <div className="flex gap-4 flex-grow">
            <a
              className="button text-white shadow-solid text-2xl"
              href="https://github.com/a16z-infra/ai-town"
            >
              <div className="inline-block bg-clay-700">
                <span>
                  <div className="inline-flex items-center gap-4">
                    <img className="w-6 h-6" src="/assets/star.svg" />
                    Star
                  </div>
                </span>
              </div>
            </a>
          </div>

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
