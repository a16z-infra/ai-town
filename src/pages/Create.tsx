import { useState, useEffect } from 'react';
import NavButton from '../components/buttons/NavButton';
import ActionButton from '../components/buttons/ActionButton';
import WalletButton from '../components/buttons/WalletButton';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import bs58 from 'bs58';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import GenerationStatus from '../components/GenerationStatus';
import { FaEgg } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface Generation {
  id: string;
  name: string;
  wallet: string;
  tokenBalance: string;
  avatarUrl: string;
  isBorn: boolean;
  imageUrl: string;
  signature: string;
  character: string;
  identity: string;
  createdAt: string;
}

interface LeaderboardResponse {
  items: Generation[];
  metadata: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
    nextOffset: number | null;
  };
}

const TOWN_TOKEN_ADDRESS = new PublicKey('9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump');
const API_URL = import.meta.env.VITE_API_ROUTE_URL;
const RPC_URL = import.meta.env.VITE_RPC_URL;

// Move connection outside component to avoid recreating it on every render
const connection = new Connection(RPC_URL, 'confirmed');

const fetchLeaderboardPage = async ({ pageParam = 0 }): Promise<LeaderboardResponse> => {
  const response = await fetch(
    `${API_URL}/api/leaderboard?limit=20&offset=${pageParam}&isBorn=false`,
  );
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// Add utility function for shortening wallet address
const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export default function Create() {
  const { connected, publicKey, signMessage } = useWallet();
  const { ref: loadMoreRef, inView } = useInView();
  const queryClient = useQueryClient();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery<
    LeaderboardResponse,
    Error,
    InfiniteData<LeaderboardResponse>
  >({
    queryKey: ['leaderboard', 'unborn'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchLeaderboardPage({ pageParam: pageParam as number }),
    getNextPageParam: (lastPage: LeaderboardResponse) => lastPage.metadata.nextOffset,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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
      return Number(balance.value.uiAmountString);
    } catch (error) {
      // Handle case where token account doesn't exist
      if (error instanceof Error && error.message.includes('could not find account')) {
        return 0;
      }
      console.error('Error checking token balance:', error);
      return 0;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      character: '',
      identity: '',
    });
    setErrors({
      name: '',
      character: '',
      identity: '',
      token: '',
    });
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
      const message = `Generate Solana Town Member: ${formData.name} ${formData.character} ${formData.identity}`;
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
          toast.success('Generation successful!', {
            position: 'bottom-right',
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#eeff99',
              borderRadius: '4px',
              fontSize: '16px',
              fontFamily: 'Super Pixel, monospace',
            },
          });
          // Invalidate and refetch leaderboard query
          queryClient.invalidateQueries({ queryKey: ['leaderboard', 'unborn'] });
          // Reset form
          resetForm();
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

  // Combine all pages of data
  const allGenerations = data?.pages.flatMap((page: LeaderboardResponse) => page.items) ?? [];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between font-body rest-background w-full">
      <div className="w-full min-h-screen relative isolate overflow-hidden lg:p-8 shadow-2xl">
        <div className="text-center">
          <nav className="flex justify-center gap-8 mb-12">
            <NavButton to="/">HOME</NavButton>
            <NavButton to="/create">CREATE</NavButton>
            <NavButton to="/game-design">GAME DESIGN</NavButton>
            <NavButton to="/road-map">ROAD MAP</NavButton>
          </nav>

          {/* Content */}
          <div className="flex flex-col items-center justify-center py-24">
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
                  <label className="text-[#eeff99] font-display text-2xl mb-3 block">LORE</label>
                  <textarea
                    maxLength={500}
                    value={formData.identity}
                    onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
                    placeholder="Write a backstory for your character. Who are they? Where did they come from? What drives them? What are their goals and aspirations in SolanaTown? What secrets do they hold?"
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

          {/* Leaderboard Section */}
          <div className="mt-16 w-full max-w-6xl mx-auto px-8 pb-16">
            <h2 className="text-[#eeff99] font-display text-4xl mb-8">WAITING ROOM</h2>
            <GenerationStatus />
            <div className="bg-black/80 rounded-lg p-6">
              {status === 'pending' ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#eeff99]"></div>
                </div>
              ) : status === 'error' ? (
                <div className="text-center py-8 text-red-500">Error loading leaderboard</div>
              ) : allGenerations.length === 0 ? (
                <div className="flex h-[50vh] items-center justify-center">
                  <div className="text-center py-8 font-display text-2xl text-[#eeff99]">
                    NO GENERATIONS YET, GENERATE A CITIZEN!
                  </div>
                </div>
              ) : (
                <>
                  <div className="sticky top-0 bg-black/80 z-10 py-4">
                    <div className="grid grid-cols-5 gap-4 text-[#eeff99] font-display text-xl px-4">
                      <div>RANK</div>
                      <div>AVATAR</div>
                      <div>NAME</div>
                      <div>WALLET</div>
                      <div>$TOWN</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {allGenerations.map((item: Generation, index: number) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-5 gap-4 items-center bg-black/40 rounded p-4 text-white"
                      >
                        <div className="font-display text-[#eeff99] flex items-center relative pl-6">
                          {index < 10 && (
                            <div
                              className="group absolute left-0 flex cursor-help"
                              title="This avatar will be born in the next generation"
                            >
                              <FaEgg className="text-[#eeff99] animate-pulse w-4 h-4" />
                              <span className="pointer-events-none absolute -top-7 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100 bg-black/90 text-[#eeff99] text-sm rounded px-2 py-1">
                                Will be born next generation
                              </span>
                            </div>
                          )}
                          <span className="font-numbers flex-1 text-center">#{index + 1}</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="w-16 h-16 relative">
                            <img
                              src={item.avatarUrl}
                              alt={item.name}
                              className="absolute inset-0 w-full h-full object-contain rounded brightness-90"
                            />
                          </div>
                        </div>
                        <div className="font-display">{item.name}</div>
                        <div className="font-display truncate">{shortenAddress(item.wallet)}</div>
                        <div className="font-display">
                          <span className="font-numbers">{item.tokenBalance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div ref={loadMoreRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#eeff99]"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 rounded-full bg-[#eeff99] px-4 py-2 text-black shadow-lg transition-colors hover:bg-[#deff66] z-50 flex items-center gap-2"
        >
          <span>↑</span>
          <span>Go to top</span>
        </button>
      )}
    </div>
  );
}
