export type UserRole =
  | "GENERAL_MANAGER"
  | "DIGITAL_HEAD"
  | "CRM_EXECUTIVE"
  | "SITE_MANAGER"
  | "TELECALLER";

export const ROLES: Record<UserRole, { label: string; description: string; homePath: string }> = {
  GENERAL_MANAGER: {
    label: "General Manager",
    description: "Full organization-wide oversight, performance reports, audit logs, and employee administration",
    homePath: "/",
  },
  DIGITAL_HEAD: {
    label: "Digital Head",
    description: "Campaign and promotional content management, lead generation, and task distribution",
    homePath: "/",
  },
  CRM_EXECUTIVE: {
    label: "CRM Executive",
    description: "Lead intake, CSV import, telecaller assignment, coordination, and follow-up tracking",
    homePath: "/",
  },
  SITE_MANAGER: {
    label: "Site Manager",
    description: "Assigned site visit operations, site schedules, status updates, and field remarks",
    homePath: "/",
  },
  TELECALLER: {
    label: "Telecaller",
    description: "Assigned lead calling, feedback recording, follow-up scheduling, and site-visit fixing",
    homePath: "/",
  },
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
  employeeCode?: string;
  department?: string;
  designation?: string;
}

export function canManageEmployees(role: UserRole): boolean {
  return role === "GENERAL_MANAGER";
}

export function canViewAuditLogs(role: UserRole): boolean {
  return role === "GENERAL_MANAGER";
}

export function canManageCampaigns(role: UserRole): boolean {
  return role === "GENERAL_MANAGER" || role === "DIGITAL_HEAD";
}

export function canImportLeads(role: UserRole): boolean {
  return role === "GENERAL_MANAGER" || role === "DIGITAL_HEAD" || role === "CRM_EXECUTIVE";
}

export function canAssignLeads(role: UserRole): boolean {
  return role === "GENERAL_MANAGER" || role === "DIGITAL_HEAD" || role === "CRM_EXECUTIVE";
}

export function canAssignTasks(role: UserRole): boolean {
  return role === "GENERAL_MANAGER" || role === "DIGITAL_HEAD" || role === "CRM_EXECUTIVE";
}

export function canViewAllLeads(role: UserRole): boolean {
  return role === "GENERAL_MANAGER" || role === "DIGITAL_HEAD" || role === "CRM_EXECUTIVE";
}

export function canManageSites(role: UserRole): boolean {
  return role === "GENERAL_MANAGER" || role === "CRM_EXECUTIVE";
}

export function canViewAllReports(role: UserRole): boolean {
  return role === "GENERAL_MANAGER" || role === "DIGITAL_HEAD" || role === "CRM_EXECUTIVE";
}
