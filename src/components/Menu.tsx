import { Dialog, Transition } from '@headlessui/react';
import { Checkbox } from '@mui/material';
import { useQuery, useAction, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Fragment, useState } from 'react';
// import { Descriptions, characters as characterData } from '../../convex/characterdata/data';

export default function Menu({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  function closeModal() {
    setIsOpen(false);
  }

  // const allMaps = useQuery(api.worlds.getAllMaps);
  // const allWorlds = useQuery(api.worlds.getAllWorlds);
  // const allCharacters = characterData;
  // const createWorldAction = useAction(api.worlds.createWorld);
  // const loadWorldMutation = useMutation(api.worlds.loadWorld);
  const allWorlds = [];
  const allMaps = [];
  const allCharacters = [];
  const descriptions = [];

  const [selectedMap, setSelectedMap] = useState<string>();
  const [selectedWorld, setSelectedWorld] = useState<string>();
  const [characterNames, setCharacterNames] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<number>();
  const [creatingWorld, setCreatingWorld] = useState<boolean>(false);
  const [loadingWorld, setLoadingWorld] = useState<boolean>(false);

  const createWorldSteps = ['Select Map', 'Select Characters'];

  const loadWorld = async () => {
    //await loadWorldMutation({ worldId: selectedWorld! });
  };

  // const createWorld = async () => {
  //   const characters = allCharacters?.filter((character) => characterNames.has(character.name));
  //   const descriptions = Descriptions?.filter((description) => characterNames.has(description.character));
  //   await createWorldAction({mapId: selectedMap!, characters, descriptions });
  // };

  const toggleWorld = (worldId: string) => {
    if (selectedWorld == worldId) {
      setSelectedWorld(undefined);
    } else {
      setSelectedWorld(worldId);
    }
  };

  const toggleMap = (mapId: string) => {
    if (selectedMap == mapId) {
      setSelectedMap(undefined);
    } else {
      setSelectedMap(mapId);
    }
  };

  const toggleCharacter = (characterName: string) => {
    if (characterNames.has(characterName)) {
      characterNames.delete(characterName);
      setCharacterNames(new Set(characterNames));
    } else {
      characterNames.add(characterName);
      setCharacterNames(new Set(characterNames));
    }
  };

  const dialogTitle = () => {
    if (!creatingWorld) {
      return 'Menu';
    } else {
      // return createWorldSteps[currentStep!];
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  {dialogTitle()}
                </Dialog.Title>
                {/* <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Your payment has been successfully submitted. We’ve sent
                    you an email with all of the details of your order.
                  </p>
                </div> */}

                <div className="mt-4 flex flex-col space-y-4">
                  {!creatingWorld && !loadingWorld && (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none"
                      onClick={() => {
                        setCreatingWorld(true);
                        setCurrentStep(0);
                      }}
                    >
                      Create World
                    </button>
                  )}
                  {!creatingWorld && !loadingWorld && (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none"
                      onClick={() => {
                        setLoadingWorld(true);
                      }}
                    >
                      Load World
                    </button>
                  )}
                  {loadingWorld && (
                    <>
                      <div className="max-h-60 overflow-auto">
                        {allWorlds?.map((world: Record<string, any>) => (
                          <Fragment key={world._id}>
                            <div className="flex items-center">
                              <Checkbox
                                aria-labelledby={world._id}
                                checked={selectedWorld == world._id}
                                onChange={() => toggleWorld(world._id)}
                              />
                              <span className="text-black" id={world._id}>
                                {world._id}
                              </span>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                      <div className="flex flex-row justify-between">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          onClick={() => {
                            setLoadingWorld(false);
                          }}
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          onClick={loadWorld}
                        >
                          Load World
                        </button>
                      </div>
                    </>
                  )}
                  {creatingWorld && (
                    <form onSubmit={createWorld}>
                      {currentStep == 0 && (
                        <>
                          <div className="max-h-60 overflow-auto">
                            {allMaps?.map((map: Record<string, any>) => (
                              <Fragment key={map._id}>
                                <div className="flex items-center">
                                  <Checkbox
                                    aria-labelledby={map._id}
                                    checked={selectedMap == map._id}
                                    onChange={() => toggleMap(map._id)}
                                  />
                                  <span className="text-black" id={map._id}>
                                    {map._id}
                                  </span>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                          <div className="flex flex-row justify-between">
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              onClick={() => {
                                setCreatingWorld(false);
                                setCurrentStep(undefined);
                              }}
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              onClick={() => setCurrentStep(currentStep + 1)}
                            >
                              Next
                            </button>
                          </div>
                        </>
                      )}
                      {currentStep == 1 && (
                        <>
                          <div className="max-h-60 overflow-auto">
                            {allCharacters?.map((character: Record<string, any>) => (
                              <Fragment key={character.name}>
                                <div className="flex items-center">
                                  <Checkbox
                                    aria-labelledby={character._id}
                                    checked={characterNames.has(character.name)}
                                    onChange={() => toggleCharacter(character.name)}
                                  />
                                  <span className="text-black" id={character._id}>
                                    {
                                      Descriptions?.find((el) => el.character == character.name)
                                        ?.name
                                    }
                                  </span>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                          <div className="flex flex-row justify-between">
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              onClick={() => setCurrentStep(currentStep - 1)}
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              onClick={createWorld}
                            >
                              Create
                            </button>
                          </div>
                        </>
                      )}
                    </form>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
