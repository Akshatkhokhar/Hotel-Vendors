interface PillTabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default function PillTab({ label, isActive, onClick }: PillTabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-8 py-3 rounded-full font-body text-sm font-medium transition-all duration-300 whitespace-nowrap border
        ${isActive 
          ? 'bg-terracotta text-white border-terracotta shadow-md shadow-terracotta/20' 
          : 'bg-white text-muted-teal border-surface-dim hover:border-muted-teal'
        }
      `}
    >
      {label}
    </button>
  );
}
