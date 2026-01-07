"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle, XCircle, Eye, Clock, User, FileText, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/date-format";

interface KYCUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  role: string;
  panCard: string | null;
  aadharCard: string | null;
  kycStatus: string;
  kycSubmittedAt: string | null;
  kycApprovedAt: string | null;
  kycRejectedAt: string | null;
  kycRejectionReason: string | null;
  createdAt: string;
}

export default function AdminKYCPage() {
  const router = useRouter();
  const [users, setUsers] = useState<KYCUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchKYCs(token);
  }, [router, statusFilter]);

  const fetchKYCs = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/kyc?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else if (response.status === 403) {
        toast.error("Access denied. Admin only.");
        router.push("/my-account");
      } else {
        toast.error("Failed to load KYC requests");
      }
    } catch (error) {
      console.error("Error fetching KYCs:", error);
      toast.error("Failed to load KYC requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setProcessing(userId);
    try {
      const response = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action: "APPROVE",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("KYC approved successfully");
        fetchKYCs(token);
        setSelectedUser(null);
      } else {
        toast.error(data.message || "Failed to approve KYC");
      }
    } catch (error) {
      console.error("Error approving KYC:", error);
      toast.error("Failed to approve KYC");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setProcessing(userId);
    try {
      const response = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action: "REJECT",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("KYC rejected");
        fetchKYCs(token);
        setSelectedUser(null);
        setRejectionReason("");
      } else {
        toast.error(data.message || "Failed to reject KYC");
      }
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      toast.error("Failed to reject KYC");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
                KYC Verification
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">Review and approve user KYC documents</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  statusFilter === "PENDING"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending ({users.filter((u) => u.kycStatus === "PENDING").length})
              </button>
              <button
                onClick={() => setStatusFilter("APPROVED")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  statusFilter === "APPROVED"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Approved ({users.filter((u) => u.kycStatus === "APPROVED").length})
              </button>
              <button
                onClick={() => setStatusFilter("REJECTED")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  statusFilter === "REJECTED"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Rejected ({users.filter((u) => u.kycStatus === "REJECTED").length})
              </button>
            </div>
          </div>
        </div>

        {/* KYC List */}
        {users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-lg">No {statusFilter.toLowerCase()} KYC requests found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{user.fullName}</h3>
                        <p className="text-gray-600 text-sm">
                          {user.phoneNumber} • {user.role}
                        </p>
                        {user.email && (
                          <p className="text-gray-500 text-sm">{user.email}</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.kycStatus === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : user.kycStatus === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.kycStatus}
                      </span>
                    </div>

                    {/* Documents */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold">PAN Card</span>
                          </div>
                          {user.panCard ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        {user.panCard ? (
                          <a
                            href={user.panCard}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline text-sm flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Document</span>
                          </a>
                        ) : (
                          <p className="text-gray-400 text-sm">Not uploaded</p>
                        )}
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold">Aadhar Card</span>
                          </div>
                          {user.aadharCard ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        {user.aadharCard ? (
                          <a
                            href={user.aadharCard}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline text-sm flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Document</span>
                          </a>
                        ) : (
                          <p className="text-gray-400 text-sm">Not uploaded</p>
                        )}
                      </div>
                    </div>

                    {/* Status Info */}
                    {user.kycSubmittedAt && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>Submitted: {formatDate(user.kycSubmittedAt)}</span>
                      </div>
                    )}
                    {user.kycRejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                        <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{user.kycRejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {user.kycStatus === "PENDING" && user.panCard && user.aadharCard && (
                    <div className="lg:w-64 flex flex-col gap-3">
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={processing === user.id}
                        className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
                      >
                        {processing === user.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rejection Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject KYC</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting {selectedUser.fullName}'s KYC verification.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedUser.id)}
                  disabled={!rejectionReason.trim() || processing === selectedUser.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  {processing === selectedUser.id ? "Processing..." : "Reject KYC"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
























