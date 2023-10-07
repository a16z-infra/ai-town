import { MouseEventHandler, ReactNode } from 'react';

export default function Button(props: {
  href?: string;
  imgUrl: string;
  onClick?: MouseEventHandler;
  title?: string;
  children: ReactNode;
}) {
  return (
    <a
      className="button text-white shadow-solid text-2xl pointer-events-auto"
      href={props.href}
      title={props.title}
      onClick={props.onClick}
    >
      <div className="inline-block bg-clay-700">
        <span>
          <div className="inline-flex h-full items-center gap-4">
            <img className="w-[30px] h-[30px]" src={props.imgUrl} />
            {props.children}
          </div>
        </span>
      </div>
    </a>
  );
}
