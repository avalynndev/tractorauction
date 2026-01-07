import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Export data to PDF
export function exportToPDF(title: string, data: any[], columns: string[]) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Prepare table data
  const tableData = data.map((row: any) => 
    columns.map(col => row[col] || "")
  );
  
  // Add table
  autoTable(doc, {
    head: [columns],
    body: tableData,
    startY: 30,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
  });
  
  doc.save(`${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}

// Export data to Excel
export function exportToExcel(title: string, data: any[], columns: string[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((row: any) => {
      const obj: any = {};
      columns.forEach(col => {
        obj[col] = row[col] || "";
      });
      return obj;
    })
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  
  XLSX.writeFile(workbook, `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// Export overview report to PDF
export function exportOverviewToPDF(overviewData: any) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("Platform Overview Report", 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  let yPos = 40;
  
  // Vehicles Section
  doc.setFontSize(14);
  doc.text("Vehicles", 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    head: [["Metric", "Value"]],
    body: [
      ["Total Vehicles", overviewData.vehicles?.total || 0],
      ["Pending", overviewData.vehicles?.pending || 0],
      ["Approved", overviewData.vehicles?.approved || 0],
      ["Rejected", overviewData.vehicles?.rejected || 0],
      ["In Auction", overviewData.vehicles?.auction || 0],
      ["Sold", overviewData.vehicles?.sold || 0],
      ["Approval Rate", overviewData.vehicles?.approvalRate || "0%"],
    ],
    startY: yPos,
    styles: { fontSize: 10 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Auctions Section
  doc.setFontSize(14);
  doc.text("Auctions", 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    head: [["Metric", "Value"]],
    body: [
      ["Total Auctions", overviewData.auctions?.total || 0],
      ["Live", overviewData.auctions?.live || 0],
      ["Ended", overviewData.auctions?.ended || 0],
      ["Success Rate", overviewData.auctions?.successRate || "0%"],
    ],
    startY: yPos,
    styles: { fontSize: 10 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Users Section
  doc.setFontSize(14);
  doc.text("Users", 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    head: [["Metric", "Value"]],
    body: [
      ["Total Users", overviewData.users?.total || 0],
      ["Buyers", overviewData.users?.buyers || 0],
      ["Sellers", overviewData.users?.sellers || 0],
      ["Dealers", overviewData.users?.dealers || 0],
    ],
    startY: yPos,
    styles: { fontSize: 10 },
  });
  
  doc.save(`Overview_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}
