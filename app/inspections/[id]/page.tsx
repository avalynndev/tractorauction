"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileCheck, Download, Calendar, User, CheckCircle2, AlertTriangle, X, ArrowLeft, Camera, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import BackButton from "@/components/navigation/BackButton";

interface InspectionReport {
  id: string;
  vehicleId: string;
  inspectedBy: string;
  inspectionDate: string;
  inspectionType: string;
  status: string;
  engineCondition?: string;
  transmissionCondition?: string;
  hydraulicSystem?: string;
  electricalSystem?: string;
  bodyCondition?: string;
  tyreCondition?: string;
  overallCondition?: string;
  odometerReading?: string;
  hoursRun?: string;
  issuesFound?: string;
  issuesCount: number;
  criticalIssues: number;
  inspectionPhotos: string[];
  inspectionDocument?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  estimatedRepairCosts?: string;
  totalEstimatedCost?: number;
  vehicle: {
    id: string;
    tractorBrand: string;
    tractorModel?: string;
    referenceNumber?: string;
    yearOfMfg: number;
    engineHP: string;
    vehicleType: string;
  };
  inspector?: {
    fullName?: string;
  };
}

export default function InspectionReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/inspections/${reportId}`, {
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else if (response.status === 401 || response.status === 403) {
        // Try public access
        const publicResponse = await fetch(`/api/inspections/${reportId}/public`);
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          setReport(publicData.report);
        } else {
          toast.error("Inspection report not found or access denied");
          router.push("/auctions");
        }
      } else {
        toast.error("Failed to load inspection report");
        router.push("/auctions");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("An error occurred");
      router.push("/auctions");
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (condition?: string) => {
    if (!condition) return "text-gray-500";
    switch (condition.toLowerCase()) {
      case "excellent":
        return "text-green-600 font-semibold";
      case "good":
        return "text-blue-600 font-semibold";
      case "fair":
        return "text-yellow-600 font-semibold";
      case "poor":
        return "text-red-600 font-semibold";
      default:
        return "text-gray-600";
    }
  };

  const getConditionScore = (condition?: string): number => {
    if (!condition) return 0;
    switch (condition.toLowerCase()) {
      case "excellent":
        return 90;
      case "good":
        return 75;
      case "fair":
        return 60;
      case "poor":
        return 40;
      default:
        return 0;
    }
  };

  const getConditionIcon = (condition?: string) => {
    if (!condition) return Minus;
    switch (condition.toLowerCase()) {
      case "excellent":
        return TrendingUp;
      case "good":
        return TrendingUp;
      case "fair":
        return TrendingDown;
      case "poor":
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/inspections/${reportId}/pdf`, {
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Inspection-Report-${report?.vehicle.tractorBrand}-${report?.vehicle.referenceNumber || reportId.substring(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("PDF downloaded successfully");
      } else {
        const errorData = await response.json().catch(() => ({ message: "Failed to generate PDF" }));
        toast.error(errorData.message || "Failed to generate PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("An error occurred while downloading PDF");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inspection report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Inspection report not found</p>
          <Link
            href="/auctions"
            className="mt-4 inline-block text-primary-600 hover:underline"
          >
            Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  const overallScore = getConditionScore(report.overallCondition);
  const conditionScores = {
    engine: getConditionScore(report.engineCondition),
    transmission: getConditionScore(report.transmissionCondition),
    hydraulic: getConditionScore(report.hydraulicSystem),
    electrical: getConditionScore(report.electricalSystem),
    body: getConditionScore(report.bodyCondition),
    tyres: getConditionScore(report.tyreCondition),
  };
  const averageScore = Object.values(conditionScores).filter(s => s > 0).length > 0
    ? Math.round(Object.values(conditionScores).filter(s => s > 0).reduce((a, b) => a + b, 0) / Object.values(conditionScores).filter(s => s > 0).length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <BackButton />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <FileCheck className="w-8 h-8 text-blue-600" />
                  <span>Inspection Report</span>
                </h1>
                <p className="text-gray-600 mt-1">
                  {report.vehicle.tractorBrand} {report.vehicle.tractorModel} - {report.vehicle.referenceNumber || "N/A"}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Overall Condition Score Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-100 text-sm mb-2">Overall Condition Score</p>
              <div className="flex items-center space-x-4">
                <div className="text-5xl font-bold">{averageScore > 0 ? averageScore : overallScore}</div>
                <div>
                  <p className="text-xl font-semibold">{report.overallCondition || "Not Assessed"}</p>
                  <p className="text-blue-100 text-sm">
                    {report.inspectionType} Inspection
                  </p>
                </div>
              </div>
            </div>
            {report.status === "APPROVED" && (
              <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Verified Report</span>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Vehicle Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Brand</p>
              <p className="font-semibold">{report.vehicle.tractorBrand}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Model</p>
              <p className="font-semibold">{report.vehicle.tractorModel || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Year</p>
              <p className="font-semibold">{report.vehicle.yearOfMfg}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Engine HP</p>
              <p className="font-semibold">{report.vehicle.engineHP}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reference Number</p>
              <p className="font-semibold">{report.vehicle.referenceNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inspection Date</p>
              <p className="font-semibold">
                {new Date(report.inspectionDate).toLocaleDateString()}
              </p>
            </div>
            {report.odometerReading && (
              <div>
                <p className="text-sm text-gray-600">Odometer</p>
                <p className="font-semibold">{report.odometerReading}</p>
              </div>
            )}
            {report.hoursRun && (
              <div>
                <p className="text-sm text-gray-600">Hours Run</p>
                <p className="font-semibold">{report.hoursRun}</p>
              </div>
            )}
          </div>
        </div>

        {/* Condition Assessment with Scores */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Component Condition Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "engineCondition", label: "Engine", score: conditionScores.engine },
              { key: "transmissionCondition", label: "Transmission", score: conditionScores.transmission },
              { key: "hydraulicSystem", label: "Hydraulic System", score: conditionScores.hydraulic },
              { key: "electricalSystem", label: "Electrical System", score: conditionScores.electrical },
              { key: "bodyCondition", label: "Body", score: conditionScores.body },
              { key: "tyreCondition", label: "Tyres", score: conditionScores.tyres },
            ].map(({ key, label, score }) => {
              const condition = (report as any)[key];
              const Icon = getConditionIcon(condition);
              return (
                <div
                  key={key}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{label}</p>
                    <Icon className={`w-5 h-5 ${getConditionColor(condition)}`} />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                          className={`h-2.5 rounded-full ${
                            score >= 80
                              ? "bg-green-500"
                              : score >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <p className={`text-sm ${getConditionColor(condition)}`}>
                        {condition || "Not Assessed"}
                      </p>
                    </div>
                    {score > 0 && (
                      <div className="text-lg font-bold text-gray-700">{score}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Issues Found */}
        {(report.issuesCount > 0 || report.issuesFound) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <span>Issues Found</span>
            </h2>
            <div className="flex items-center space-x-4 mb-4">
              {report.criticalIssues > 0 && (
                <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                  <span className="font-bold text-lg">{report.criticalIssues}</span> Critical Issue{report.criticalIssues > 1 ? "s" : ""}
                </div>
              )}
              <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <span className="font-bold text-lg">{report.issuesCount}</span> Total Issue{report.issuesCount > 1 ? "s" : ""}
              </div>
            </div>
            {report.issuesFound && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.issuesFound}</p>
              </div>
            )}
          </div>
        )}

        {/* Inspection Photos */}
        {report.inspectionPhotos && report.inspectionPhotos.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Camera className="w-6 h-6 text-blue-600" />
              <span>Inspection Photos ({report.inspectionPhotos.length})</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {report.inspectionPhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="relative h-48 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`Inspection photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <a
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-8 h-8 text-white" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inspection Document */}
        {report.inspectionDocument && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <span>Inspection Document</span>
            </h2>
            <a
              href={report.inspectionDocument}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>View Document</span>
            </a>
          </div>
        )}

        {/* Notes */}
        {report.notes && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Notes</h2>
            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
              {report.notes}
            </p>
          </div>
        )}

        {/* Verification Info */}
        {report.verifiedBy && report.verifiedAt && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Verification</span>
            </h3>
            <p className="text-sm text-green-800">
              Verified on {new Date(report.verifiedAt).toLocaleDateString()}
            </p>
            {report.verificationNotes && (
              <p className="text-sm text-green-700 mt-2">{report.verificationNotes}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex space-x-4">
          <Link
            href={`/vehicles/${report.vehicleId}`}
            className="flex-1 text-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            View Vehicle Details
          </Link>
          {report.vehicleId && (
            <Link
              href={`/auctions?vehicleId=${report.vehicleId}`}
              className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              View Auction
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

