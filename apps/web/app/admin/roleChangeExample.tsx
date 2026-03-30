/**
 * Admin Role Change Component Example
 * 
 * This is a reference implementation for the admin role change UI.
 * Place this in apps/web/app/admin/role-change/page.tsx
 */

"use client";

import React, { useState, useEffect } from "react";

type Role = "COMMUNITY_HEAD" | "COMMUNITY_SUBHEAD" | "GOTRA_HEAD" | "FAMILY_HEAD" | "MEMBER";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: boolean;
  createdAt: string;
  profile?: {
    phone?: string;
    gotra?: string;
    profession?: string;
    location?: string;
  };
}

interface RoleChangePermissions {
  role: Role;
  canEditRoles: Role[];
  requiresMultipleApprovals: boolean;
  minimumApprovals: number;
  description: string;
}

/**
 * Performs  admin role change page operation.
 * @returns {any} Description of return value
 */
export default function AdminRoleChangePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<RoleChangePermissions | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<Role | "">("");
  const [approvalIds, setApprovalIds] = useState<string[]>([]);
  const [subheadUsers, setSubheadUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch permissions on mount
  useEffect(() => {
    fetchPermissions();
    fetchUsers();
  }, []);

  async function fetchPermissions() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/role-change-permissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPermissions(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
    }
  }

  async function fetchUsers(roleFilter?: Role) {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = roleFilter 
        ? `/api/admin/users?role=${roleFilter}&limit=100`
        : "/api/admin/users?limit=100";
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubheads() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/users?role=COMMUNITY_SUBHEAD", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubheadUsers(data.data.users);
      }
    } catch (err) {
      console.error("Failed to fetch subheads:", err);
    }
  }

  async function handleRoleChange() {
    if (!selectedUser || !newRole) {
      setMessage({ type: "error", text: "Please select a user and new role" });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const body: { newRole: Role; approvalIds?: string[] } = { newRole };
      if (permissions?.requiresMultipleApprovals && approvalIds.length > 0) {
        body.approvalIds = approvalIds;
      }

      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage({ 
          type: "success", 
          text: `Successfully changed ${selectedUser.name}'s role to ${newRole}` 
        });
        // Refresh users list
        await fetchUsers();
        // Reset form
        setSelectedUser(null);
        setNewRole("");
        setApprovalIds([]);
      } else {
        setMessage({ 
          type: "error", 
          text: data.message || "Failed to change role" 
        });
      }
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: "An error occurred while changing the role" 
      });
      console.error("Role change error:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleApprovalId(id: string) {
    setApprovalIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  }

  if (!permissions) {
    return <div className="p-8">Loading permissions...</div>;
  }

  if (permissions.canEditRoles.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            No Role Change Permissions
          </h2>
          <p className="text-yellow-700">{permissions.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Role Management</h1>
        <p className="text-gray-600 mb-8">
          Your Role: <span className="font-semibold">{permissions.role}</span> | {permissions.description}
        </p>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - User Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Select User to Edit</h2>
            
            {/* Filter by Role */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role:
              </label>
              <select
                onChange={(e) => fetchUsers(e.target.value as Role || undefined)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Roles</option>
                <option value="COMMUNITY_HEAD">Community Head</option>
                <option value="COMMUNITY_SUBHEAD">Community Subhead</option>
                <option value="GOTRA_HEAD">Gotra Head</option>
                <option value="FAMILY_HEAD">Family Head</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>

            {/* Users List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-gray-500">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-gray-500">No users found</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 border rounded-md cursor-pointer transition ${
                      selectedUser?.id === user.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Current Role: <span className="font-semibold">{user.role}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Role Change Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Change Role</h2>

            {!selectedUser ? (
              <p className="text-gray-500">Select a user from the left panel</p>
            ) : (
              <div className="space-y-4">
                {/* Selected User Info */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Current Role: <span className="font-semibold">{selectedUser.role}</span>
                  </p>
                </div>

                {/* New Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Role:
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">-- Select Role --</option>
                    {permissions.canEditRoles.map((role) => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Approval Selection (if needed) */}
                {permissions.requiresMultipleApprovals && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Approvers (need {permissions.minimumApprovals - 1} more):
                    </label>
                    <button
                      onClick={fetchSubheads}
                      className="text-sm text-blue-600 hover:underline mb-2"
                    >
                      Load Community Subheads
                    </button>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                      {subheadUsers.map((user) => (
                        <label key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={approvalIds.includes(user.id)}
                            onChange={() => toggleApprovalId(user.id)}
                            className="rounded"
                          />
                          <span className="text-sm">{user.name} ({user.email})</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {approvalIds.length} / {permissions.minimumApprovals - 1} required
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleRoleChange}
                  disabled={
                    loading ||
                    !newRole ||
                    (permissions.requiresMultipleApprovals && 
                     approvalIds.length < permissions.minimumApprovals - 1)
                  }
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    loading ||
                    !newRole ||
                    (permissions.requiresMultipleApprovals && 
                     approvalIds.length < permissions.minimumApprovals - 1)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Changing Role..." : "Change Role"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Permissions Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Permissions</h3>
          <p className="text-blue-700 mb-2">{permissions.description}</p>
          <div className="text-sm text-blue-600">
            <p>Can edit roles: {permissions.canEditRoles.join(", ")}</p>
            {permissions.requiresMultipleApprovals && (
              <p className="mt-1">
                Requires {permissions.minimumApprovals} total approvals (including yourself)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
