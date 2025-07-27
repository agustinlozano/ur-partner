import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CompletedCategory } from "@/lib/dynamodb";
import "./realtime.css";

interface PartnerTrackerProps {
  partnerSlot: "a" | "b";
  partner: { name: string; avatar: string };
  connected: boolean;
  selectedCategory: string | null;
  completedCategories: CompletedCategory[];
  progress: number;
  isReady: boolean;
}

export function PartnerTracker({
  partnerSlot,
  partner,
  connected,
  selectedCategory,
  completedCategories,
  progress,
  isReady,
}: PartnerTrackerProps) {
  const [firstName] = partner.name.split(" ");
  const shortName =
    firstName.length > 10 ? firstName.slice(0, 10) + "..." : firstName;

  // State for tracking changes and animations
  const [isAnimating, setIsAnimating] = useState(false);
  const prevDataRef = useRef({
    connected,
    selectedCategory,
    completedCategories: [...completedCategories],
    progress,
    isReady,
    partnerName: partner.name,
    partnerAvatar: partner.avatar,
  });

  // State for badge animation
  const [badgeAnim, setBadgeAnim] = useState(false);
  const prevCategoryRef = useRef(selectedCategory);

  useEffect(() => {
    if (selectedCategory !== prevCategoryRef.current) {
      setBadgeAnim(true);
      const timer = setTimeout(() => setBadgeAnim(false), 700);
      prevCategoryRef.current = selectedCategory;
      return () => clearTimeout(timer);
    }
  }, [selectedCategory]);

  // Effect to detect changes in partner data
  useEffect(() => {
    const currentData = {
      connected,
      selectedCategory,
      completedCategories: [...completedCategories],
      progress,
      isReady,
      partnerName: partner.name,
      partnerAvatar: partner.avatar,
    };

    const prevData = prevDataRef.current;

    // Check if any data has changed
    const hasChanged =
      currentData.connected !== prevData.connected ||
      currentData.selectedCategory !== prevData.selectedCategory ||
      currentData.completedCategories.length !==
        prevData.completedCategories.length ||
      currentData.completedCategories.some(
        (cat, index) => cat !== prevData.completedCategories[index]
      ) ||
      currentData.progress !== prevData.progress ||
      currentData.isReady !== prevData.isReady ||
      currentData.partnerName !== prevData.partnerName ||
      currentData.partnerAvatar !== prevData.partnerAvatar;

    if (hasChanged) {
      setIsAnimating(true);

      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1200); // Match animation duration

      // Update ref with new data
      prevDataRef.current = currentData;

      return () => clearTimeout(timer);
    }
  }, [
    connected,
    selectedCategory,
    completedCategories,
    progress,
    isReady,
    partner.name,
    partner.avatar,
  ]);

  return (
    <Card
      className={`p-4 w-full sm:w-64 transition-all duration-300 ${
        isAnimating ? "partner-change-animation" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="font-medium font-mono">
            {partner.avatar} {shortName}
          </span>
        </div>
        {connected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
      </div>

      <div className="space-y-3 select-none">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Current Category</p>
          {selectedCategory ? (
            <Badge
              variant="secondary"
              className={`capitalize transition-all duration-300 ${
                badgeAnim ? "badge-pop-animation" : ""
              }`}
            >
              {selectedCategory}
            </Badge>
          ) : (
            <Badge variant="outline">None selected</Badge>
          )}
        </div>

        {progress > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div>
          <p className="text-sm text-muted-foreground mb-2">Status</p>
          <div className="flex items-center gap-2">
            {isReady ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">{isReady ? "Ready" : "Not Ready"}</span>
          </div>
        </div>

        {completedCategories.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Completed</p>
            <div className="space-y-1">
              {completedCategories.map((c) => (
                <div key={c.category} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-sm capitalize">{c.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
