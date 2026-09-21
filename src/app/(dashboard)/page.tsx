import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GmDashboard } from "@/components/dashboards/GmDashboard";
import { DigitalHeadDashboard } from "@/components/dashboards/DigitalHeadDashboard";
import { CrmExecutiveDashboard } from "@/components/dashboards/CrmExecutiveDashboard";
import { SiteManagerDashboard } from "@/components/dashboards/SiteManagerDashboard";
import { TelecallerDashboard } from "@/components/dashboards/TelecallerDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  switch (user.role) {
    case "GENERAL_MANAGER":
      return <GmDashboard />;
    case "DIGITAL_HEAD":
      return <DigitalHeadDashboard />;
    case "CRM_EXECUTIVE":
      return <CrmExecutiveDashboard />;
    case "SITE_MANAGER":
      return <SiteManagerDashboard />;
    case "TELECALLER":
      return <TelecallerDashboard />;
    default:
      return <GmDashboard />;
  }
}
