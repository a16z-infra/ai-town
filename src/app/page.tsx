import Navbar from '@/components/Navbar';
import Examples from '@/components/Examples';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Navbar />
      <div className="w-full min-h-screen relative isolate overflow-hidden bg-gray-900 px-6 py-24 shadow-2xl sm:px-24 xl:py-32">
        <h1 className="mt-16 mx-auto max-w-2xl text-center text-5xl font-bold tracking-tight text-white sm:text-6xl">
          AI Town
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-center text-xl leading-8 text-slate-400 ">
          A virtual town where AI lives, chat and socialize.
        </p>

        <Examples />
      </div>
    </main>
  );
}
