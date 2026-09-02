import React from 'react';

interface OakValleyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showSubtitle?: boolean;
  textColorClass?: string;
}

export const OakValleyLogo: React.FC<OakValleyLogoProps> = ({
  size = 'md',
  className = '',
  onClick,
  textColorClass = 'text-white',
}) => {
  // Increased text sizes as requested
  const textSizeClasses = {
    sm: 'text-lg sm:text-xl font-normal tracking-[0.22em]',
    md: 'text-xl sm:text-2xl font-normal tracking-[0.24em]',
    lg: 'text-3xl sm:text-4xl font-normal tracking-[0.26em]',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 ${onClick ? 'cursor-pointer hover:opacity-90 transition-all' : ''} ${className}`}
      title="오크밸리리조트 메인"
    >
      {/* Pure text OAK VALLEY with elegant serif typography */}
      <span
        className={`${textColorClass} font-serif shrink-0 uppercase select-none ${textSizeClasses[size]}`}
        style={{
          fontFamily: "'Playfair Display', 'Times New Roman', Georgia, serif",
        }}
      >
        OAK VALLEY
      </span>
    </div>
  );
};
