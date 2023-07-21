import Navbar from "@/components/Navbar";
import Examples from "@/components/Examples";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Navbar />
      <div className="w-full min-h-screen relative isolate overflow-hidden bg-gray-900 px-6 py-24 shadow-2xl sm:px-24 xl:py-32">
        <h1 className="mt-16 mx-auto max-w-2xl text-center text-5xl font-bold tracking-tight text-white sm:text-6xl">
          AI Companion
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-center text-xl leading-8 text-slate-400">
          Help you setup an AI companion project with ease. Here are some example characters: 
        </p>

        <Examples />

        <svg
          viewBox="0 0 1024 1024"
          className="absolute left-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2"
          aria-hidden="true"
        >
          <circle
            cx={512}
            cy={512}
            r={512}
            fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
            fillOpacity="0.5"
          />
          <defs>
            <radialGradient
              id="759c1415-0410-454c-8f7c-9a820de03641"
              cx={0}
              cy={0}
              r={1}
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(512 512) rotate(90) scale(512)"
            >
              <stop stopColor="rgb(17 24 39)" />
              <stop offset={1} stopColor="rgb(125 211 252)" stopOpacity={0} />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </main>
  );
}
