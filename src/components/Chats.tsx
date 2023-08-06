import { ChatMessage } from './Examples';

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ');
}

export default function Chats({
  messages,
  playerState,
}: {
  messages: ChatMessage[];
  playerState: any;
}) {
  return (
    <div className="flow-root  max-h-full">
      {messages.length === 0 ? (
        <div className="relative pb-8">Click on an agent on the map to see chat history</div>
      ) : (
        <ul role="list" className="-mb-8 overflow-auto">
          <li className="mb-5">
            <h3 className="text-base font-semibold leading-6 text-gray-900">{playerState.name}</h3>
            <p className="text-sm text-gray-500">
              <span>{playerState.identity}</span>
            </p>
          </li>
          {messages.map((message, messageIdx) => (
            <li key={message.id}>
              <div className="relative pb-8">
                {messageIdx !== messages.length - 1 ? (
                  <span
                    className="absolute left-1 top-2 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={classNames(
                        'bg-gray-400',
                        'h-2 w-2 rounded-full flex items-center justify-center ring-3 ring-white',
                      )}
                    ></span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div className="whitespace-nowrap text-top text-sm text-gray-500">
                      <time dateTime={message.ts.toString()}>
                        {new Date(message.ts).toLocaleString()}
                      </time>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        <b>{message.from}: </b>
                        {message.content}{' '}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
