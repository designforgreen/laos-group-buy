'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export default function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        onExpire?.();
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // 小于1小时显示紧急状态
      setIsUrgent(hours < 1);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={`flex items-center gap-1 font-mono ${isUrgent ? 'countdown-urgent' : ''}`}>
      <span className="text-gray-500 text-sm mr-1">⏰</span>
      <div className="bg-gray-900 text-white px-2 py-1 rounded text-sm">
        {formatNumber(timeLeft.hours)}
      </div>
      <span className="text-gray-400">:</span>
      <div className="bg-gray-900 text-white px-2 py-1 rounded text-sm">
        {formatNumber(timeLeft.minutes)}
      </div>
      <span className="text-gray-400">:</span>
      <div className="bg-gray-900 text-white px-2 py-1 rounded text-sm">
        {formatNumber(timeLeft.seconds)}
      </div>
    </div>
  );
}
