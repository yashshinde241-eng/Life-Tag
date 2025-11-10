import React from 'react';
import './Loader.css';

const Loader = ({ text = 'Loading Life-Tag...', minDisplayTime = 1200, onComplete }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [canHide, setCanHide] = React.useState(false);
  const rotationCount = React.useRef(0);
  const startTimeRef = React.useRef(Date.now());
  const finishedRef = React.useRef(false);
  const requiredRotations = 1; // lower the required rotations so faster finish with visible spin

  React.useEffect(() => {
    // Start fade-in animation on mount
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Ensure minimum display time. After minDisplayTime we allow hiding (if rotations reached)
    const hideTimer = setTimeout(() => {
      if (rotationCount.current >= requiredRotations) {
        setCanHide(true);
      } else {
        // If rotations not yet reached, we'll wait for animation iterations to set hide
      }
    }, minDisplayTime);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [minDisplayTime]);

  // Notify parent once the loader criteria are met (only once)
  React.useEffect(() => {
    if (canHide && !finishedRef.current) {
      finishedRef.current = true;
      if (typeof onComplete === 'function') {
        try {
          onComplete();
        } catch (e) {
          // swallow errors from callback to avoid breaking the loader
          // parent components can handle their own errors
          // eslint-disable-next-line no-console
          console.error('Loader onComplete callback error:', e);
        }
      }
    }
  }, [canHide, onComplete]);

  // Only render if we haven't met minimum display criteria
  if (!canHide) {
    return (
      <div 
        className={`app-loader-overlay ${isVisible ? 'visible' : ''}`} 
        role="status" 
        aria-live="polite"
      >
        <div className="app-loader-container">
          <img
            src={process.env.PUBLIC_URL + '/logo192.png'}
            alt="Life-Tag"
            className="loader-logo"
            onAnimationIteration={() => {
              rotationCount.current += 1;
              // Check if we can hide after each rotation
              if (rotationCount.current >= requiredRotations &&
                  Date.now() - startTimeRef.current >= minDisplayTime) {
                setCanHide(true);
              }
            }}
          />
          <div className="loader-text">{text}</div>
        </div>
      </div>
    );
  }
  return null;
};

export default Loader;
