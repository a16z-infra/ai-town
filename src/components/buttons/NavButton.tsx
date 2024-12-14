import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface NavButtonProps {
  children: ReactNode;
  to: string;
}

export default function NavButton({ children, to }: NavButtonProps) {
  return (
    <Link to={to} className="text-[#eeff99] font-display text-xl hover:opacity-80">
      {children}
    </Link>
  );
}
