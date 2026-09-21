"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  UserPlus,
  Lock,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  KeyRound,
  MoreVertical,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Employee Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("TELECALLER");
  const [department, setDepartment] = useState("Telecalling");
  const [designation, setDesignation] = useState("Telecalling Specialist");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Employee / Password Reset Modal
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Error loading employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department,
          designation,
          employeeCode,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create employee account");
      }

      setShowCreateModal(false);
      setName("");
      setEmail("");
      setPassword("");
      fetchEmployees();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const body: any = {};
      if (editRole) body.role = editRole;
      if (editStatus) body.status = editStatus;
      if (newPassword) body.password = newPassword;

      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update employee account");
      }

      setSelectedEmployee(null);
      setNewPassword("");
      fetchEmployees();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (emp: any) => {
    setSelectedEmployee(emp);
    setEditRole(emp.role);
    setEditStatus(emp.status);
    setNewPassword("");
    setEditError(null);
  };

  const filteredEmployees = employees.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(s) ||
      e.email.toLowerCase().includes(s) ||
      e.role.toLowerCase().includes(s) ||
      e.profile?.employeeCode?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Employee Accounts & Role Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            RBAC security controls, credential administration, account activation, and role assignments.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="crm-button-primary flex items-center gap-1.5 text-xs py-2 px-4 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Employee Account</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role, or code..."
            className="crm-input pl-9 text-xs"
          />
        </div>
        <span className="text-xs text-slate-500 hidden sm:block">
          Total Staff: <strong>{employees.length}</strong> accounts
        </span>
      </div>

      {/* Employees Table */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="crm-table-header">
                <th className="crm-table-header">Employee</th>
                <th className="crm-table-header">Code</th>
                <th className="crm-table-header">Role & Department</th>
                <th className="crm-table-header">Status</th>
                <th className="crm-table-header">Workload Stats</th>
                <th className="crm-table-header">Last Login</th>
                <th className="crm-table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading staff directory...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No employees found</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="crm-table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="text-slate-500 font-mono text-[11px]">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="crm-table-cell font-mono font-bold text-slate-700">
                      {emp.profile?.employeeCode || "—"}
                    </td>
                    <td className="crm-table-cell">
                      <div>
                        <span className="font-mono font-semibold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {emp.role.replace(/_/g, " ")}
                        </span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {emp.profile?.department} • {emp.profile?.designation}
                        </p>
                      </div>
                    </td>
                    <td className="crm-table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          emp.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : emp.status === "SUSPENDED"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="crm-table-cell text-slate-600 text-[11px]">
                      {emp.role === "TELECALLER" && (
                        <span>
                          {emp._count?.assignedTelecallerLeads || 0} leads • {emp._count?.callReports || 0} calls
                        </span>
                      )}
                      {emp.role === "SITE_MANAGER" && (
                        <span>{emp._count?.assignedSiteVisits || 0} site visits assigned</span>
                      )}
                      {emp.role !== "TELECALLER" && emp.role !== "SITE_MANAGER" && (
                        <span>{emp._count?.tasksAssigned || 0} active tasks</span>
                      )}
                    </td>
                    <td className="crm-table-cell text-slate-500 font-mono text-[11px]">
                      {formatDateTime(emp.lastLogin)}
                    </td>
                    <td className="crm-table-cell text-right">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="crm-button-secondary text-xs py-1 px-3"
                      >
                        Edit / Reset Password
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Create Employee Account</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@kyra.com"
                    className="crm-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="crm-input font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Assignment *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="crm-input font-semibold"
                  >
                    <option value="GENERAL_MANAGER">General Manager</option>
                    <option value="DIGITAL_HEAD">Digital Head</option>
                    <option value="CRM_EXECUTIVE">CRM Executive</option>
                    <option value="SITE_MANAGER">Site Manager</option>
                    <option value="TELECALLER">Telecaller</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="crm-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="crm-input font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="crm-input font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="crm-button-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800"
                >
                  {createLoading ? "Saving..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Reset Password Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Edit Employee Profile</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  {selectedEmployee.name} ({selectedEmployee.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateEmployee} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Role Permission
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="crm-input font-semibold"
                >
                  <option value="GENERAL_MANAGER">General Manager</option>
                  <option value="DIGITAL_HEAD">Digital Head</option>
                  <option value="CRM_EXECUTIVE">CRM Executive</option>
                  <option value="SITE_MANAGER">Site Manager</option>
                  <option value="TELECALLER">Telecaller</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="crm-input font-semibold"
                >
                  <option value="ACTIVE">ACTIVE (Authorized to Login)</option>
                  <option value="INACTIVE">INACTIVE (Temporarily Disabled)</option>
                  <option value="SUSPENDED">SUSPENDED (Locked for Security)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new 8+ character password"
                  className="crm-input font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="crm-button-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
