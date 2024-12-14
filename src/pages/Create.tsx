import { useState, useEffect } from 'react';
import NavButton from '../components/buttons/NavButton';
import ActionButton from '../components/buttons/ActionButton';
import WalletButton from '../components/buttons/WalletButton';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import bs58 from 'bs58';
import { getAssociatedTokenAddress } from '@solana/spl-token';

const TOWN_TOKEN_ADDRESS = new PublicKey('9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump');
const API_URL = import.meta.env.VITE_API_ROUTE_URL;
const RPC_URL = import.meta.env.VITE_RPC_URL;

// Move connection outside component to avoid recreating it on every render
const connection = new Connection(RPC_URL, 'confirmed');

export default function Create() {
  const { connected, publicKey, signMessage } = useWallet();

  const [formData, setFormData] = useState({
    name: '',
    character: '',
    identity: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    character: '',
    identity: '',
    token: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [hasEnoughTokens, setHasEnoughTokens] = useState(false);

  useEffect(() => {
    let mounted = true;
    let pollInterval: number;

    const checkBalance = async () => {
      if (connected && publicKey) {
        const balance = await checkTokenBalance();
        if (mounted) {
          setHasEnoughTokens(balance > 0);
        }
      }
    };

    checkBalance();

    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [connected, publicKey]);

  const checkTokenBalance = async () => {
    if (!publicKey) return 0;

    try {
      const tokenAccount = await getAssociatedTokenAddress(TOWN_TOKEN_ADDRESS, publicKey);
      const balance = await connection.getTokenAccountBalance(tokenAccount);
      return Number(balance.value.amount);
    } catch (error) {
      // Handle case where token account doesn't exist
      if ((error as any)?.message?.includes('could not find account')) {
        return 0;
      }
      console.error('Error checking token balance:', error);
      return 0;
    }
  };

  const handleSubmit = async () => {
    if (!connected || !hasEnoughTokens || !signMessage || !publicKey) return;
    setIsLoading(true);

    // Reset errors
    setErrors({ name: '', character: '', identity: '', token: '' });

    let hasErrors = false;
    const newErrors = { name: '', character: '', identity: '', token: '' };

    // Form validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      hasErrors = true;
    }
    if (!formData.character.trim()) {
      newErrors.character = 'Character description is required';
      hasErrors = true;
    }
    if (!formData.identity.trim()) {
      newErrors.identity = 'Identity is required';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Create message to sign
      const message = `Generate character: ${formData.character}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureString = bs58.encode(signature);

      // Initial request
      const response = await fetch(API_URL + '/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formData.character,
          signature: signatureString,
          wallet: publicKey.toBase58(),
          message,
          name: formData.name,
          identity: formData.identity,
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const { predictionId } = await response.json();

      // Modified polling with cleanup
      let isPolling = true;
      while (isPolling) {
        const statusRes = await fetch(
          `${API_URL}/api/generate?predictionId=${predictionId}&wallet=${publicKey.toBase58()}&prompt=${encodeURIComponent(formData.character)}&name=${encodeURIComponent(formData.name)}&identity=${encodeURIComponent(formData.identity)}&signature=${signatureString}`,
        );

        if (!statusRes.ok) {
          isPolling = false;
          throw new Error('Status check failed');
        }

        const result = await statusRes.json();

        if (result.status === 'complete') {
          setImageData(result.url);
          isPolling = false;
          break;
        } else if (result.status === 'failed') {
          isPolling = false;
          throw new Error('Generation failed during processing');
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Generation error:', error);
      setErrors((prev) => ({ ...prev, token: 'Generation failed' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between font-body rest-background w-full">
      <div className="w-full lg:h-screen min-h-screen relative isolate overflow-hidden lg:p-8 shadow-2xl flex flex-col justify-start">
        <div className="text-center">
          <nav className="flex justify-center gap-8 mb-12">
            <NavButton to="/">HOME</NavButton>
            <NavButton to="/create">CREATE</NavButton>
            <NavButton to="/game-design">GAME DESIGN</NavButton>
            <NavButton to="/road-map">ROAD MAP</NavButton>
          </nav>

          {/* Content */}
          <div className="flex flex-col items-center justify-center flex-1 py-24">
            <h1 className="font-display text-6xl mb-4" style={{ color: '#eeff99' }}>
              BORDER SERVICES
            </h1>
            <p className="text-white text-xl mb-16 text-center">
              CREATE YOUR CHARACTER AND WAIT IN QUEUE TO RECEIVE YOUR
              <br />
              PASSPORT INTO SOLANATOWN.
            </p>

            <div className="grid grid-cols-2 gap-16 max-w-5xl w-full px-8">
              {/* Character Preview */}
              <div className="bg-black/80 rounded-lg aspect-square flex items-center justify-center">
                {imageData ? (
                  <img
                    src={imageData}
                    alt="Generated character"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-white/50">Character preview will appear here</span>
                )}
              </div>

              {/* Form */}
              <div className="flex flex-col gap-8">
                <div>
                  <label className="text-[#eeff99] font-display text-2xl mb-3 block">NAME</label>
                  <input
                    type="text"
                    maxLength={50}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name..."
                    className={`w-full bg-black/80 rounded p-4 text-white border-none outline-none focus:ring-2 focus:ring-[#eeff99]/50 ${
                      errors.name ? 'ring-2 ring-red-500' : ''
                    }`}
                  />
                  {errors.name && <p className="text-white mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-[#eeff99] font-display text-2xl mb-3 block">
                    CHARACTER
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.character}
                    onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                    placeholder="Rogue with poisoned daggers"
                    className={`w-full bg-black/80 rounded p-4 text-white border-none outline-none focus:ring-2 focus:ring-[#eeff99]/50 ${
                      errors.character ? 'ring-2 ring-red-500' : ''
                    }`}
                  />
                  {errors.character && <p className="text-white mt-1">{errors.character}</p>}
                </div>
                <div>
                  <label className="text-[#eeff99] font-display text-2xl mb-3 block">
                    IDENTITY
                  </label>
                  <textarea
                    maxLength={500}
                    value={formData.identity}
                    onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
                    placeholder="A mysterious wanderer..."
                    className={`w-full bg-black/80 rounded p-4 text-white h-48 border-none outline-none focus:ring-2 focus:ring-[#eeff99]/50 resize-none ${
                      errors.identity ? 'ring-2 ring-red-500' : ''
                    }`}
                  />
                  {errors.identity && <p className="text-white mt-1">{errors.identity}</p>}
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  <WalletButton />
                  {connected && (
                    <>
                      <ActionButton onClick={handleSubmit} disabled={isLoading || !hasEnoughTokens}>
                        {isLoading ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            GENERATING...
                          </span>
                        ) : !hasEnoughTokens ? (
                          'INSUFFICIENT $TOWN BALANCE'
                        ) : (
                          'GENERATE'
                        )}
                      </ActionButton>
                      {errors.token && <p className="text-white mt-1">{errors.token}</p>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
