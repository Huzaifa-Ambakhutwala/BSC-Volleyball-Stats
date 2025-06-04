import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, AlertTriangle, Power, PowerOff } from "lucide-react";

interface DowntimeConfig {
  active: boolean;
  start: string | null;
  end: string | null;
  message: string;
  overriddenByAdmin: boolean;
}

const ManageDowntime = () => {
  const { toast } = useToast();
  const [downtime, setDowntime] = useState<DowntimeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [immediateMessage, setImmediateMessage] = useState("");
  const [showImmediateModal, setShowImmediateModal] = useState(false);

  // Load current downtime status
  const loadDowntimeStatus = async () => {
    try {
      const response = await fetch("/api/downtime");
      if (response.ok) {
        const data = await response.json();
        setDowntime(data);
      } else {
        setDowntime({
          active: false,
          start: null,
          end: null,
          message: "",
          overriddenByAdmin: false
        });
      }
    } catch (error) {
      console.error("Error loading downtime status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDowntimeStatus();
  }, []);

  // Schedule downtime
  const handleScheduleDowntime = async () => {
    if (!scheduleStart || !scheduleEnd || !scheduleMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields for scheduled downtime",
        variant: "destructive",
      });
      return;
    }

    const startDate = new Date(scheduleStart);
    const endDate = new Date(scheduleEnd);

    if (endDate <= startDate) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/downtime/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: scheduleStart,
          end: scheduleEnd,
          message: scheduleMessage.trim()
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Downtime scheduled successfully",
        });
        setScheduleStart("");
        setScheduleEnd("");
        setScheduleMessage("");
        loadDowntimeStatus();
      } else {
        throw new Error("Failed to schedule downtime");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule downtime",
        variant: "destructive",
      });
    }
  };

  // Start immediate downtime
  const handleStartDowntimeNow = async () => {
    const message = immediateMessage.trim() || "The site is temporarily under maintenance. Please check back later.";
    
    try {
      const response = await fetch("/api/downtime/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        toast({
          title: "Downtime Started",
          description: "The site is now in maintenance mode",
        });
        setImmediateMessage("");
        setShowImmediateModal(false);
        loadDowntimeStatus();
      } else {
        throw new Error("Failed to start downtime");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start downtime",
        variant: "destructive",
      });
    }
  };

  // End downtime now
  const handleEndDowntimeNow = async () => {
    try {
      const response = await fetch("/api/downtime/end", {
        method: "POST"
      });

      if (response.ok) {
        toast({
          title: "Downtime Ended",
          description: "The site is now back online",
        });
        loadDowntimeStatus();
      } else {
        throw new Error("Failed to end downtime");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end downtime",
        variant: "destructive",
      });
    }
  };

  const isCurrentlyActive = () => {
    if (!downtime || !downtime.active) return false;
    const now = new Date();
    const start = downtime.start ? new Date(downtime.start) : null;
    const end = downtime.end ? new Date(downtime.end) : null;
    
    return (!start || now >= start) && (!end || now <= end) && !downtime.overriddenByAdmin;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Manage Downtime</h2>
        
        {/* Current Status */}
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Current Status
          </h3>
          
          {downtime && (downtime.active || downtime.start) ? (
            <div className="space-y-3">
              <div className={`px-4 py-2 rounded-lg ${
                isCurrentlyActive() 
                  ? "bg-red-100 text-red-800 border border-red-200" 
                  : downtime.active 
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}>
                <div className="font-semibold">
                  {isCurrentlyActive() ? "🔴 Site is currently in maintenance mode" :
                   downtime.active ? "⏳ Downtime scheduled but admin override active" :
                   "📅 Downtime scheduled"}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {downtime.start && (
                  <div>
                    <span className="font-medium">Start:</span> {new Date(downtime.start).toLocaleString()}
                  </div>
                )}
                {downtime.end && (
                  <div>
                    <span className="font-medium">End:</span> {new Date(downtime.end).toLocaleString()}
                  </div>
                )}
              </div>
              
              {downtime.message && (
                <div className="mt-3">
                  <span className="font-medium">Message:</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded border">
                    {downtime.message}
                  </div>
                </div>
              )}
              
              {downtime.overriddenByAdmin && (
                <div className="text-sm text-orange-600 font-medium">
                  ⚠️ Admin override is active - downtime disabled for admin session
                </div>
              )}
            </div>
          ) : (
            <div className="text-green-600 font-medium">
              ✅ No downtime scheduled - site is fully operational
            </div>
          )}
        </div>

        {/* Immediate Controls */}
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Power className="h-5 w-5 mr-2" />
            Immediate Controls
          </h3>
          
          <div className="flex gap-4">
            <button
              onClick={() => setShowImmediateModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition flex items-center"
              disabled={isCurrentlyActive()}
            >
              <PowerOff className="h-4 w-4 mr-2" />
              Start Downtime Now
            </button>
            
            <button
              onClick={handleEndDowntimeNow}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center"
              disabled={!downtime?.active}
            >
              <Power className="h-4 w-4 mr-2" />
              End Downtime Now
            </button>
          </div>
        </div>

        {/* Schedule Downtime */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Schedule Downtime
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date/Time</label>
              <input
                type="datetime-local"
                value={scheduleStart}
                onChange={(e) => setScheduleStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date/Time</label>
              <input
                type="datetime-local"
                value={scheduleEnd}
                onChange={(e) => setScheduleEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Downtime Message</label>
            <textarea
              value={scheduleMessage}
              onChange={(e) => setScheduleMessage(e.target.value)}
              placeholder="Enter the message users will see during downtime..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={handleScheduleDowntime}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition flex items-center"
          >
            <Clock className="h-4 w-4 mr-2" />
            Schedule Downtime
          </button>
        </div>
      </div>

      {/* Immediate Downtime Modal */}
      {showImmediateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Start Immediate Downtime</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Downtime Message (Optional)</label>
              <textarea
                value={immediateMessage}
                onChange={(e) => setImmediateMessage(e.target.value)}
                placeholder="The site is temporarily under maintenance. Please check back later."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleStartDowntimeNow}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition flex-1"
              >
                Start Downtime
              </button>
              <button
                onClick={() => setShowImmediateModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDowntime;