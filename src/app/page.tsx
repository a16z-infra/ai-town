import Navbar from '@/components/Navbar';
import Examples from '@/components/Examples';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between font-body game-background">
      <Navbar />
      <div className="w-full min-h-screen relative isolate overflow-hidden px-6 py-24 shadow-2xl sm:px-24 xl:py-32 flex flex-col justify-center">
        <h1 className="mx-auto text-center text-6xl sm:text-8xl font-bold font-display leading-none tracking-wide game-title">
          AI Town
        </h1>

        <p className="mx-auto my-4 text-center text-xl sm:text-2xl text-white leading-tight">
          A virtual town where AI characters live, chat and socialize.
        </p>

        <Examples />
      </div>
    </main>
  );
}
