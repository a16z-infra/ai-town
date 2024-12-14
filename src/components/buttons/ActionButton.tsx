import { ReactNode } from 'react';

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export default function ActionButton({ children, onClick, disabled }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-[#ff4444] text-white font-display px-12 py-3 text-xl uppercase transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#ff6666]'
      }`}
    >
      {children}
    </button>
  );
}
