import React from 'react';

interface LoadingIconProps {
  size?: number;
  duration?: number;
  className?: string;
}

const LoadingIcon: React.FC<LoadingIconProps> = ({ 
  size = 16, 
  duration = 8,
  className = '' 
}) => {
  const styles = {
    loader: {
      width: `${size}px`,
      overflow: 'visible' as const,
      transform: 'rotate(-90deg)',
      transformOrigin: 'center',
      animation: 'spin 2s linear infinite',
    } as React.CSSProperties,
  };

  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(-90deg); }
      100% { transform: rotate(270deg); }
    }
    
    @keyframes active-animation {
      0% { stroke-dasharray: 0 0 0 360 0 360; }
      12.5% { stroke-dasharray: 0 0 270 90 270 90; }
      25% { stroke-dasharray: 0 270 0 360 0 360; }
      37.5% { stroke-dasharray: 0 270 270 90 270 90; }
      50% { stroke-dasharray: 0 540 0 360 0 360; }
      50.001% { stroke-dasharray: 0 180 0 360 0 360; }
      62.5% { stroke-dasharray: 0 180 270 90 270 90; }
      75% { stroke-dasharray: 0 450 0 360 0 360; }
      87.5% { stroke-dasharray: 0 450 270 90 270 90; }
      87.501% { stroke-dasharray: 0 90 270 90 270 90; }
      100% { stroke-dasharray: 0 360 1 360 0 360; }
    }
    
    @keyframes track-animation {
      0% { stroke-dasharray: 0 20 320 40 320 40; }
      12.5% { stroke-dasharray: 0 290 50 310 50 310; }
      25% { stroke-dasharray: 0 290 320 40 320 40; }
      37.5% { stroke-dasharray: 0 560 50 310 50 310; }
      37.501% { stroke-dasharray: 0 200 50 310 50 310; }
      50% { stroke-dasharray: 0 200 320 40 320 40; }
      62.5% { stroke-dasharray: 0 470 50 310 50 310; }
      62.501% { stroke-dasharray: 0 110 50 310 50 310; }
      75% { stroke-dasharray: 0 110 320 40 320 40; }
      87.5% { stroke-dasharray: 0 380 50 310 50 310; }
      100% { stroke-dasharray: 0 380 320 40 320 40; }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <svg 
        className={`circular-loader ${className}`}
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
        style={styles.loader}
      >
        <circle
          className="active"
          pathLength="360"
          fill="transparent"
          strokeWidth="4"
          cx="12"
          cy="12"
          r="11"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDashoffset="360"
          style={{
            animation: `active-animation ${duration}s ease-in-out infinite`,
          }}
        />
        <circle
          className="track"
          pathLength="360"
          fill="transparent"
          strokeWidth="4"
          cx="12"
          cy="12"
          r="11"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDashoffset="360"
          style={{
            opacity: 0.3,
            animation: `track-animation ${duration}s ease-in-out infinite`,
          }}
        />
      </svg>
    </>
  );
};

export default LoadingIcon;