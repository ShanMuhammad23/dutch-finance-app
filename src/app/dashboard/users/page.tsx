import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { UsersView } from "./_components/users-view";

export default function UsersPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Breadcrumb pageName="Users" />
      <UsersView />
    </div>
  );
}

