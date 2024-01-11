import { useState } from 'react';
import { Select } from './Select.tsx';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const scenarioTypes = [{ id: 1, name: 'Multi-agent Debate' }];

export function CreateScenario({ setCreatingScenario }: { setCreatingScenario: any }) {
  const createScenario = useMutation(api.init.createScenario);
  //const [type, setType] = useState(scenarioTypes[0]);
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('');

  const handleTopicChange = (event: any) => {
    setTopic(event.target.value); // Update the state variable
  };

  const handleSourceChange = (event: any) => {
    setSource(event.target.value); // Update the state variable
  };

  const handleSubmit = (e: any) => {
    // Prevent the default form submission behavior
    e.preventDefault();

    console.log('Topic:', topic, 'Source:', source);

    // Call mutation function with the form data
    createScenario({
      topic,
      source,
    });
    setCreatingScenario(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-12 px-12 pt-6">
        <div className="pb-12">
          <h2 className="text-2xl text-center justify-center font-bold leading-7 text-gray-900">
            Create a Scenario
          </h2>
          <div className="mt-5">
            <Select options={scenarioTypes} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-6">
            <div className="col-span-full">
              <label
                htmlFor="username"
                className="block text-base font-medium leading-6 text-gray-900"
              >
                Topic
              </label>
              <div className="mt-2">
                <div className="flex w-full bg-white rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-gray-600">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={topic}
                    onChange={handleTopicChange}
                    autoComplete="username"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="Suggest a topic for debate..."
                  />
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <label
                htmlFor="about"
                className="block text-base font-medium leading-6 text-gray-900"
              >
                Source
              </label>
              <div className="mt-2">
                <textarea
                  id="about"
                  name="about"
                  rows={8}
                  value={source}
                  onChange={handleSourceChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6"
                  placeholder="Paste a document to serve as a source for the debate."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-x-6">
        <button
          type="submit"
          className="rounded-md bg-white px-3 py-2 text-lg font-semibold text-gray-900 shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Create Scenario
        </button>
      </div>
    </form>
  );
}
