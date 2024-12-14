import { ReactNode } from 'react';

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
}

export default function ActionButton({ children, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-[#ff4444] hover:bg-[#ff6666] text-white font-display px-12 py-3 text-xl uppercase transition-colors"
    >
      {children}
    </button>
  );
}
