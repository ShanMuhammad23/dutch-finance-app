import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActivityLogsView } from "./_components/activity-logs-view";

export default function ActivityLogsPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName="Activity Log" />
      <ActivityLogsView />
    </div>
  );
}

