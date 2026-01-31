interface ButtonProps {
  children: React.ReactNode;
  variant: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ children, variant, onClick, disabled = false }: ButtonProps) {
  const baseStyles = 'w-full h-11 px-6 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed focus-visible:ring-[3px] focus-visible:ring-[#0ea5e9]/50 focus-visible:outline-none active:scale-[0.98]';
  
  const variantStyles = {
    primary: 'bg-primary text-black hover:bg-primary/90 shadow-sm',
    secondary: 'bg-[#18181B] text-white hover:bg-[#18181B]/80',
    outline: 'border border-white/[0.08] bg-transparent text-white hover:bg-white/[0.06] hover:border-white/[0.12]'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {children}
    </button>
  );
}