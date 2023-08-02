'use client';
import { useEffect, useState } from 'react';
import QAModal from './QAModal';
import Image from 'next/image';
import { Tooltip } from 'react-tooltip';

import { getCompanions } from './actions';
import Chats from './Chats';

export default function Examples() {
  const [QAModalOpen, setQAModalOpen] = useState(false);
  const [CompParam, setCompParam] = useState({
    name: '',
    title: '',
    imageUrl: '',
  });
  const [examples, setExamples] = useState([
    {
      name: '',
      title: '',
      imageUrl: '',
      llm: '',
      phone: '',
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companions = await getCompanions();
        let entries = JSON.parse(companions);
        let setme = entries.map((entry: any) => ({
          name: entry.name,
          title: entry.title,
          imageUrl: entry.imageUrl,
          llm: entry.llm,
          phone: entry.phone,
        }));
        setExamples(setme);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div className="mx-auto min-h-screen w-full max-w grow lg:flex xl:px-2 mt-7">
        {/* Left sidebar & main wrapper */}
        <div className="flex-1 xl:flex">
          <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 bg-slate-50">
            {/* Main area */}
          </div>
        </div>

        <div className="flex flex-col shrink-0 border-t border-gray-200 px-4 py-6 sm:px-6 lg:w-96 lg:border-l lg:border-t-0 lg:pr-8 xl:pr-6 bg-slate-300 space-y-11">
          {/* Right column area */}
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-neutral-700">
            Conversations
          </h1>
          <Chats />
        </div>
      </div>
    </>
  );
}
