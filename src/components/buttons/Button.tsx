import clsx from 'clsx';
import { MouseEventHandler, ReactNode } from 'react';

export default function Button(props: {
  className?: string;
  href?: string;
  target?: string;
  imgUrl: string;
  onClick?: MouseEventHandler;
  title?: string;
  children: ReactNode;
}) {
  return (
    <a
      className={clsx(
        'button text-white shadow-solid text-xl pointer-events-auto',
        props.className,
      )}
      href={props.href}
      target={props.target}
      // Opening in a new tab without this leaves the new page able to reach back via `opener`.
      rel={props.target === '_blank' ? 'noopener noreferrer' : undefined}
      title={props.title}
      onClick={props.onClick}
    >
      <div className="inline-block bg-clay-700">
        <span>
          <div className="inline-flex h-full items-center gap-4">
            <img className="w-4 h-4 sm:w-[30px] sm:h-[30px]" src={props.imgUrl} />
            {props.children}
          </div>
        </span>
      </div>
    </a>
  );
}
