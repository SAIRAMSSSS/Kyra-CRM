"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckSquare,
  PlusCircle,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  X,
  Filter,
  Search,
  Calendar,
  Layers,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, isDateOverdue } from "@/lib/utils";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [category, setCategory] = useState("Lead Followup");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Complete/Update Task Modal
  const [updatingTask, setUpdatingTask] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState("COMPLETED");
  const [completionNotes, setCompletionNotes] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  // Employees for assignment dropdown
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data) => {
        if (data.employees) {
          setEmployees(data.employees);
          if (data.employees.length > 0) {
            setAssignedToId(data.employees[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          assignedToId,
          category,
          priority,
          dueDate: dueDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      fetchTasks();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingTask) return;

    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/tasks/${updatingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          completionNotes: targetStatus === "COMPLETED" ? completionNotes : undefined,
        }),
      });

      if (res.ok) {
        setUpdatingTask(null);
        setCompletionNotes("");
        fetchTasks();
      }
    } catch (err) {
      console.error("Error updating task status:", err);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Work & Task Assignment Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Operational delegation, field logistics, marketing deliverables, and team task completion.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="crm-button-primary flex items-center gap-1.5 text-xs py-2 px-4 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Assign New Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="crm-input max-w-xs"
        >
          <option value="">All Task Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="crm-input max-w-xs"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="col-span-full p-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            <CheckSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No tasks found</p>
            <p className="text-slate-500 text-xs mt-0.5">
              Assign work to employees using the button above.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const isOverdue = task.status !== "COMPLETED" && isDateOverdue(task.dueDate);
            return (
              <div
                key={task.id}
                className={`crm-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all ${
                  isOverdue ? "border-rose-300 bg-rose-50/20" : ""
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {task.displayId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">{task.description}</p>
                  )}
                  {task.completionNotes && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-100">
                      <strong>Completion notes:</strong> {task.completionNotes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {task.assignedTo?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-600" : "text-slate-400"}`} />
                      <span className={isOverdue ? "text-rose-700 font-bold" : ""}>
                        Due: {formatDate(task.dueDate)}
                      </span>
                    </span>
                  </div>

                  {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                    <div className="pt-2 flex items-center justify-end gap-2">
                      {task.status !== "IN_PROGRESS" && (
                        <button
                          onClick={() => {
                            setUpdatingTask(task);
                            setTargetStatus("IN_PROGRESS");
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium border border-slate-200"
                        >
                          Start Working
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setUpdatingTask(task);
                          setTargetStatus("COMPLETED");
                        }}
                        className="px-3 py-1 rounded bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold shadow-xs"
                      >
                        Mark Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Assign Work Task</h3>
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

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Inspect Pollachi farm water connection before client arrival"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Assigned Employee *
                </label>
                <select
                  required
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="crm-input font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role.replace(/_/g, " ")} ({emp.profile?.department || "KYRA"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Task Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="crm-input"
                  >
                    <option value="Lead Followup">Lead Followup</option>
                    <option value="Site Visit Coordination">Site Visit Coordination</option>
                    <option value="Promotional Content">Promotional Content</option>
                    <option value="Customer Verification">Customer Verification</option>
                    <option value="Administrative">Administrative</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="crm-input"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Detailed Instructions
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline clear deliverables, contact numbers, or expected output..."
                  className="crm-input resize-none"
                />
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
                  {createLoading ? "Assigning..." : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Task Status Modal */}
      {updatingTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Update Task Status</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5 truncate max-w-xs">
                  {updatingTask.displayId} • {updatingTask.title}
                </p>
              </div>
              <button
                onClick={() => setUpdatingTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Select Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="crm-input font-semibold"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {targetStatus === "COMPLETED" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Completion Notes / Work Output
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Document completion summary, links, or client feedback..."
                    className="crm-input resize-none"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setUpdatingTask(null)}
                  className="crm-button-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800"
                >
                  {updateLoading ? "Updating..." : "Confirm Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
