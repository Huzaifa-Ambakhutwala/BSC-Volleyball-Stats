import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface DowntimeConfig {
  active: boolean;
  start: string | null;
  end: string | null;
  message: string;
  overriddenByAdmin: boolean;
}

export const useDowntimeCheck = () => {
  const [location, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkDowntime = async () => {
      try {
        const response = await fetch("/api/downtime");
        if (response.ok) {
          const downtime: DowntimeConfig = await response.json();
          
          // Check if downtime is currently active
          if (downtime.active && !downtime.overriddenByAdmin) {
            const now = new Date();
            const start = downtime.start ? new Date(downtime.start) : null;
            const end = downtime.end ? new Date(downtime.end) : null;
            
            const isDowntimeActive = 
              (!start || now >= start) && 
              (!end || now <= end);
            
            if (isDowntimeActive) {
              // Redirect to maintenance page unless already there
              if (!location.includes('/maintenance.html')) {
                window.location.href = '/maintenance.html';
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking downtime status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    // Don't check downtime for maintenance page or admin override routes
    if (!location.includes('/maintenance.html')) {
      checkDowntime();
      
      // Check every minute for scheduled downtime activation
      const interval = setInterval(checkDowntime, 60000);
      return () => clearInterval(interval);
    } else {
      setIsChecking(false);
    }
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