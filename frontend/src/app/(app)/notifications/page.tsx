"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Define the exact shape of the data coming from your FastAPI backend
interface Notification {
  id: string;
  type: "High Risk" | "Update" | "Success" | "Info" | string;
  title: string;
  description: string;
  created_at: string;
  scope: "personal" | "company" | "system" | string;
}


const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const getIcon = (type: string) => {
  switch (type) {
    case "High Risk":
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    case "Success":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");


  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/notifications", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data: Notification[] = await response.json();
        setNotifications(data);
      } catch (err) {
        console.error("API Error:", err);
        setError("Unable to load notification history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type.toLowerCase().replace(" ", "-") === filter;
  });

  return (
    <div>

      <PageHeader title="Notifications" />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Alerts & Updates</CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardDescription>
              A log of all system alerts, updates, and user activities.
            </CardDescription>

            {/* 4. Working Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by: </span>
              <Select defaultValue="all" onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="high-risk">High Risk</SelectItem>
                  <SelectItem value="update">Updates</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>

              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertCircle className="h-10 w-10 mb-3" />
              <p className="font-medium">{error}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Info className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No notifications found for this filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 transition-colors hover:bg-secondary/60"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold">{notification.title}</p>

                      {notification.scope && notification.scope !== "system" && (
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                            notification.scope === "company"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {notification.scope}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(notification.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

      </Card>
    </div>
  );
}


