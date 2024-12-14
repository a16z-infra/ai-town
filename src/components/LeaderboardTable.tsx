import exampleSprite from '../../assets/example_sprite.png';

export default function LeaderboardTable() {
  return (
    <div className="bg-black/80 rounded-lg p-6 w-full max-w-4xl">
      <div className="grid grid-cols-3 gap-4 text-[#eeff99] mb-4 font-display text-xl">
        <div>RANKING</div>
        <div>CHARACTERS</div>
        <div>WALLET</div>
      </div>

      {[1, 2, 3, 4].map((rank) => (
        <div
          key={rank}
          className="grid grid-cols-3 gap-4 text-white py-4 border-t border-white/20 items-center"
        >
          <div className="font-display text-[#eeff99]">
            <span className="font-numbers">#{rank}</span>
          </div>
          <div className="h-16 w-16">
            <img
              src={exampleSprite}
              alt="Character"
              className="w-full h-full object-contain brightness-90"
            />
          </div>
          <div className="font-display">SOLANA-KEYGEN NEW</div>
        </div>
      ))}
    </div>
  );
}
