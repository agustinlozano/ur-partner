import React, { useState, useEffect } from "react";
import {
  categories,
  type PartnerTrackerProps,
} from "@/lib/personality-form-constants";

export function PartnerTracker({ roomId, isOpen }: PartnerTrackerProps) {
  const [partnerProgress, setPartnerProgress] = useState<{
    completed: string[];
    total: number;
    isReady: boolean;
    name?: string;
  }>({
    completed: [],
    total: 9,
    isReady: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // Get user role from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("activeRoom");
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || "girlfriend");
    }
  }, []);

  // Polling hook - only active when drawer is open
  useEffect(() => {
    if (!isOpen || !userRole) return;

    const pollPartnerStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/room/${roomId}/partner-status?role=${userRole}`
        );
        const data = await response.json();

        if (data.success) {
          setPartnerProgress(data.progress);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch partner status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    pollPartnerStatus();

    // Poll every 5 seconds (respecting Google Sheets limits: 300/min = 1 every 200ms, but we're being conservative)
    const interval = setInterval(pollPartnerStatus, 5000);

    return () => clearInterval(interval);
  }, [isOpen, roomId, userRole]);

  const progressPercentage = Math.round(
    (partnerProgress.completed.length / partnerProgress.total) * 100
  );

  return (
    <div className="p-6 space-y-6">
      {/* Partner Status Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-muted rounded-full px-4 py-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
            }`}
          />
          <span className="text-sm font-medium">
            {partnerProgress.name || "Your Partner"}
          </span>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold font-mono mb-2">
            {progressPercentage}%
          </div>
          <div className="text-sm text-muted-foreground">
            {partnerProgress.completed.length} of {partnerProgress.total}{" "}
            categories completed
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Categories Progress */}
      <div className="space-y-3">
        <h3 className="font-medium text-center">Category Progress</h3>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isCompleted = partnerProgress.completed.includes(category.id);

            return (
              <div
                key={category.id}
                className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : "bg-muted/50 border-border"
                }`}
              >
                <Icon
                  className={`w-5 h-5 mx-auto mb-2 ${
                    isCompleted
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="text-xs font-medium truncate">
                  {category.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ready Status */}
      {partnerProgress.isReady && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl mb-2">🎉</div>
          <div className="font-medium text-green-800 dark:text-green-200">
            Your partner is ready!
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            Both galleries are complete. Get ready for the reveal!
          </div>
        </div>
      )}
    </div>
  );
}
