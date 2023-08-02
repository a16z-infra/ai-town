const timeline = [
  {
    id: 1,
    content: `Hey Lucky! It's great to see you again. How have you been? I've missed catching up with you. Do you remember that time we went hiking together? It was such an adventure climbing that mountain. Speaking of which, have you been on any exciting outdoor adventures lately?`,
    from: 'Alex',
    date: 'Sep 20',
    datetime: '2020-09-20',
    iconBackground: 'bg-gray-400',
  },
  {
    id: 2,
    from: 'Lucky',
    content: `Hey Alex! I've been great, thanks for asking. Just got back from an epic space adventure. Let me tell you all about it! No outdoor adventures lately, but space is my playground now.`,
    date: 'Sep 22',
    datetime: '2020-09-22',
    iconBackground: 'bg-blue-500',
  },
];

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ');
}

export default function Chats() {
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {timeline.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== timeline.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={classNames(
                      event.iconBackground,
                      'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                    )}
                  ></span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      <b>{event.from}: </b>
                      {event.content}{' '}
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={event.datetime}>{event.date}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
