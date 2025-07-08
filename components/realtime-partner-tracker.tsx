import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Wifi, WifiOff } from "lucide-react";

interface PartnerTrackerProps {
  partnerSlot: "a" | "b";
  connected: boolean;
  selectedCategory: string | null;
  completedCategories: string[];
  progress: number;
  isReady: boolean;
}

export function PartnerTracker({
  partnerSlot,
  connected,
  selectedCategory,
  completedCategories,
  progress,
  isReady,
}: PartnerTrackerProps) {
  return (
    <Card className="p-4 w-full sm:w-64">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="font-medium">User {partnerSlot.toUpperCase()}</span>
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
            <Badge variant="secondary" className="capitalize">
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
              {completedCategories.map((category) => (
                <div key={category} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-sm capitalize">{category}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
