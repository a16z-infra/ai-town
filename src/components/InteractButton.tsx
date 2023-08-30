'use client';

export default function InteractButton() {
  return (
    <>
      <a
        className="button text-white shadow-solid text-2xl pointer-events-auto"
        onClick={() => {
          console.log('interact!');
        }}
        title="Play AI generated music (press m to play/mute)"
      >
        <div className="inline-block h-full bg-clay-700 cursor-pointer">
          <span>
            <div className="inline-flex items-center gap-4">
              <img className="w-[48px] h-[30px] max-w-[54px]" src="/ai-town/assets/interact.svg" />
              Interact
            </div>
          </span>
        </div>
      </a>
    </>
  );
}
