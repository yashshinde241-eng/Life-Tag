import React, { useState, useEffect } from 'react';
import './CountdownTimer.css'; // We'll create this next

// We accept two props:
// 1. expiresAt: The ISO 8601 timestamp from the backend
// 2. onExpire: A function to call when the timer hits zero
const CountdownTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // 1. Set up an interval to run every second
    const intervalId = setInterval(() => {
      const now = new Date().getTime();
      const expiryTime = new Date(expiresAt).getTime();
      const distance = expiryTime - now;

      // 2. If the distance is negative, the timer is done
      if (distance < 0) {
        clearInterval(intervalId);
        setTimeLeft('Expired');
        // If onExpire is provided, call it to refresh the list
        if (onExpire) {
          onExpire();
        }
        return;
      }

      // 3. Calculate minutes and seconds
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // 4. Format the string (e.g., "14:03")
      const formattedTime = 
        String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
      
      setTimeLeft(formattedTime);

    }, 1000);

    // 5. Clean up the interval when the component is unmounted
    return () => clearInterval(intervalId);

  }, [expiresAt, onExpire]); // Re-run if these props change

  // 6. Render the timer
  return (
    <span className={`timer-badge ${timeLeft === 'Expired' ? 'expired' : 'active'}`}>
      {timeLeft || 'Calculating...'}
    </span>
  );
};

export default CountdownTimer;