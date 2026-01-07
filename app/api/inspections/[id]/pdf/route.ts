import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { jsPDF } from "jspdf";

/**
 * Generate PDF for inspection report
 * Public access for approved/completed reports
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const reportId = resolvedParams.id;

    // Get inspection report
    const report = await prisma.vehicleInspectionReport.findUnique({
      where: { id: reportId },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            referenceNumber: true,
            yearOfMfg: true,
            engineHP: true,
            vehicleType: true,
            registrationNumber: true,
            engineNumber: true,
            chassisNumber: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { message: "Inspection report not found" },
        { status: 404 }
      );
    }

    // Only generate PDF for APPROVED or COMPLETED reports
    if (!["APPROVED", "COMPLETED"].includes(report.status)) {
      return NextResponse.json(
        { message: "PDF can only be generated for approved or completed reports" },
        { status: 403 }
      );
    }

    // Get inspector name if inspectedBy is a user ID
    let inspectorName = "Unknown Inspector";
    if (report.inspectedBy) {
      try {
        const inspector = await prisma.user.findUnique({
          where: { id: report.inspectedBy },
          select: { fullName: true },
        });
        if (inspector) {
          inspectorName = inspector.fullName;
        }
      } catch (error) {
        inspectorName = report.inspectedBy;
      }
    }

    // Parse repair costs if available
    let repairCosts: any = null;
    let totalCost = 0;
    if (report.estimatedRepairCosts) {
      try {
        repairCosts = JSON.parse(report.estimatedRepairCosts);
        totalCost = report.totalEstimatedCost || 0;
      } catch (error) {
        console.error("Error parsing repair costs:", error);
      }
    }

    // Create PDF
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 255);
    doc.text("VEHICLE INSPECTION REPORT", 105, yPosition, { align: "center" });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Report ID: ${reportId.substring(0, 8).toUpperCase()}`, 105, yPosition, { align: "center" });
    yPosition += 15;

    // Vehicle Information
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Vehicle Information", 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    const vehicleInfo = [
      ["Brand", report.vehicle.tractorBrand],
      ["Model", report.vehicle.tractorModel || "N/A"],
      ["Year", report.vehicle.yearOfMfg.toString()],
      ["Engine HP", report.vehicle.engineHP],
      ["Reference Number", report.vehicle.referenceNumber || "N/A"],
      ["Registration Number", report.vehicle.registrationNumber || "N/A"],
      ["Vehicle Type", report.vehicle.vehicleType],
    ];

    vehicleInfo.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, yPosition);
      doc.text(value || "N/A", 70, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // Inspection Details
    doc.setFontSize(16);
    doc.text("Inspection Details", 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    const inspectionInfo = [
      ["Inspection Type", report.inspectionType],
      ["Inspection Date", new Date(report.inspectionDate).toLocaleDateString()],
      ["Inspected By", inspectorName],
      ["Status", report.status],
    ];

    if (report.scheduledDate) {
      inspectionInfo.push(["Scheduled Date", new Date(report.scheduledDate).toLocaleDateString()]);
    }

    inspectionInfo.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, yPosition);
      doc.text(value || "N/A", 70, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // Condition Assessment
    doc.setFontSize(16);
    doc.text("Condition Assessment", 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    const conditions = [
      ["Engine", report.engineCondition],
      ["Transmission", report.transmissionCondition],
      ["Hydraulic System", report.hydraulicSystem],
      ["Electrical System", report.electricalSystem],
      ["Body", report.bodyCondition],
      ["Tyres", report.tyreCondition],
      ["Overall Condition", report.overallCondition],
    ];

    conditions.forEach(([component, condition]) => {
      if (condition) {
        doc.text(`${component}:`, 20, yPosition);
        doc.setTextColor(
          condition.toLowerCase() === "excellent" ? 0 : 
          condition.toLowerCase() === "good" ? 0 : 
          condition.toLowerCase() === "fair" ? 255 : 255,
          condition.toLowerCase() === "excellent" ? 128 : 
          condition.toLowerCase() === "good" ? 0 : 
          condition.toLowerCase() === "fair" ? 165 : 0,
          condition.toLowerCase() === "excellent" ? 0 : 
          condition.toLowerCase() === "good" ? 128 : 
          condition.toLowerCase() === "fair" ? 0 : 0
        );
        doc.text(condition, 70, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 6;
      }
    });

    yPosition += 5;

    // Mileage/Hours
    if (report.odometerReading || report.hoursRun) {
      doc.setFontSize(16);
      doc.text("Mileage & Hours", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      if (report.odometerReading) {
        doc.text(`Odometer Reading: ${report.odometerReading}`, 20, yPosition);
        yPosition += 6;
      }
      if (report.hoursRun) {
        doc.text(`Hours Run: ${report.hoursRun}`, 20, yPosition);
        yPosition += 6;
      }
      yPosition += 5;
    }

    // Issues Found
    if (report.issuesCount > 0 || report.issuesFound) {
      doc.setFontSize(16);
      doc.text("Issues Found", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Total Issues: ${report.issuesCount}`, 20, yPosition);
      yPosition += 6;
      doc.setTextColor(255, 0, 0);
      doc.text(`Critical Issues: ${report.criticalIssues}`, 20, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 6;

      if (report.issuesFound) {
        const issuesText = doc.splitTextToSize(report.issuesFound, 170);
        issuesText.forEach((line: string) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });
      }
      yPosition += 5;
    }

    // Repair Cost Estimates
    if (repairCosts && Object.keys(repairCosts).length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text("Estimated Repair Costs", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      Object.entries(repairCosts).forEach(([component, cost]: [string, any]) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${component}:`, 20, yPosition);
        doc.text(`₹${Number(cost).toLocaleString("en-IN")}`, 100, yPosition);
        yPosition += 6;
      });

      if (totalCost > 0) {
        yPosition += 3;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Total Estimated Cost:", 20, yPosition);
        doc.text(`₹${totalCost.toLocaleString("en-IN")}`, 100, yPosition);
        doc.setFont("helvetica", "normal");
        yPosition += 8;
      }
    }

    // Notes
    if (report.notes) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text("Additional Notes", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      const notesText = doc.splitTextToSize(report.notes, 170);
      notesText.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
    }

    // Verification
    if (report.verifiedBy && report.verifiedAt) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text("Verification", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Verified on: ${new Date(report.verifiedAt).toLocaleDateString()}`, 20, yPosition);
      yPosition += 6;
      if (report.verificationNotes) {
        const verificationText = doc.splitTextToSize(report.verificationNotes, 170);
        verificationText.forEach((line: string) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`,
        105,
        285,
        { align: "center" }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Inspection-Report-${report.vehicle.tractorBrand}-${report.vehicle.referenceNumber || reportId.substring(0, 8)}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Generate PDF error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



