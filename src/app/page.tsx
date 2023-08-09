import Navbar from '@/components/Navbar';
import Examples from '@/components/Examples';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between font-body game-background">
      <Navbar />
      <div className="w-full min-h-screen relative isolate overflow-hidden bg-gray-900 px-6 py-24 shadow-2xl sm:px-24 xl:py-32 flex flex-col justify-center">
        <h1 className="mx-auto max-w-2xl text-center text-6xl sm:text-8xl font-bold font-display leading-none tracking-wide game-title">
          AI Town
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-center text-xl leading-8 text-white">
          A virtual town where AI characters live, chat and socialize.
        </p>

        <Examples />
      </div>
    </main>
  );
}
