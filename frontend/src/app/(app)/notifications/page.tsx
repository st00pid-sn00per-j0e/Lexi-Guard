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
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "High Risk",
    icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
    title: "High-Risk Contract Detected",
    description: "Contract 'MSA-001' with Innovate Inc. has been flagged as high-risk.",
    time: "15 minutes ago",
  },
  {
    id: 2,
    type: "Update",
    icon: <Info className="h-5 w-5 text-blue-500" />,
    title: "User Role Changed",
    description: "Bob Williams' role was changed to Admin by Alice Johnson.",
    time: "1 hour ago",
  },
  {
    id: 3,
    type: "Success",
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    title: "Report Exported",
    description: "Q2 Analytics Report was successfully exported.",
    time: "3 hours ago",
  },
    {
    id: 4,
    type: "High Risk",
    icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
    title: "High-Risk Clause Found",
    description: "A new high-risk clause was identified in 'Partnership Agreement'.",
    time: "5 hours ago",
  },
];

export default function NotificationsPage() {
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
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter by:</span>
                <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
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
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 transition-colors hover:bg-secondary/60"
              >
                <div className="flex-shrink-0">{notification.icon}</div>
                <div className="flex-grow">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {notification.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
