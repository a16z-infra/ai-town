import { useWallet } from '@solana/wallet-adapter-react';

const shortenAddress = (address?: string) => {
  if (!address) return '';
  if (address.length < 10) return address;
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
};

export default function WalletButton() {
  const { connected, publicKey, select, connect, disconnect, wallets } = useWallet();

  const handleClick = async () => {
    if (!connected) {
      // Select Phantom if not already selected
      const phantom = wallets.find((w) => w.adapter.name === 'Phantom');
      if (phantom && !connected) {
        select(phantom.adapter.name);
        try {
          await connect();
        } catch (err) {
          console.error('Failed to connect:', err);
        }
      }
    } else {
      await disconnect();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#eeff99] text-black hover:bg-[#eeff99]/80 font-display px-8 py-3 rounded whitespace-nowrap"
    >
      {connected ? (
        <span className="font-numbers">{shortenAddress(publicKey?.toString())}</span>
      ) : (
        'CONNECT WALLET'
      )}
    </button>
  );
}
