import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";

interface DowntimeConfig {
  active: boolean;
  start: string | null;
  end: string | null;
  message: string;
  overriddenByAdmin: boolean;
}

// Global cache to avoid multiple API calls
let globalDowntimeCache: DowntimeConfig | null = null;
let globalCacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const useDowntimeCheck = () => {
  const [location] = useLocation();
  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkDowntime = async () => {
      // Skip if on maintenance page
      if (location.includes('/maintenance.html')) {
        setIsChecking(false);
        return;
      }

      try {
        const now = Date.now();
        
        // Use cached data if available and fresh
        if (!globalDowntimeCache || (now - globalCacheTimestamp) > CACHE_DURATION) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          try {
            const response = await fetch("/api/downtime", {
              signal: controller.signal,
              headers: { 'Cache-Control': 'max-age=30' }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              globalDowntimeCache = await response.json();
              globalCacheTimestamp = now;
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            // Silently fail - don't block the app for downtime checks
            console.warn("Downtime check failed:", fetchError);
            return;
          }
        }

        if (globalDowntimeCache?.active) {
          const currentTime = new Date();
          const start = globalDowntimeCache.start ? new Date(globalDowntimeCache.start) : null;
          const end = globalDowntimeCache.end ? new Date(globalDowntimeCache.end) : null;
          
          const isDowntimeActive = 
            (!start || currentTime >= start) && 
            (!end || currentTime <= end);
          
          if (isDowntimeActive && !location.includes('/maintenance.html')) {
            window.location.href = '/maintenance.html';
            return;
          }
        }
      } catch (error) {
        // Silently fail to avoid blocking the app
        console.warn("Downtime check error:", error);
      } finally {
        setIsChecking(false);
      }
    };

    // Skip downtime checks for maintenance page
    if (location.includes('/maintenance.html')) {
      setIsChecking(false);
      return;
    }

    // Initial check with minimal delay
    setIsChecking(true);
    setTimeout(checkDowntime, 100);
    
    // Set up periodic checks every 2 minutes (less frequent to reduce load)
    intervalRef.current = setInterval(checkDowntime, 120000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [location]);

  return { isChecking };
};

export const DowntimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isChecking } = useDowntimeCheck();

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};