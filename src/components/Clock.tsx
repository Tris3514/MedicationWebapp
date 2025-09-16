"use client";

import { useState, useEffect } from "react";

export function Clock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTime(timeString);
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 px-3 flex items-center text-sm font-mono bg-white/10 backdrop-blur-sm border border-black dark:border-white rounded-md text-primary-enhanced">
      {time}
    </div>
  );
}

