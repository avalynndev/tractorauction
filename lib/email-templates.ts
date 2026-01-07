// Email templates for scheduled reports

export function generateOverviewReportEmail(data: any): { subject: string; html: string; text: string } {
  const subject = "Daily Overview Report - Tractor Auction Platform";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .metric { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .metric-title { font-weight: bold; color: #666; font-size: 14px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; margin-top: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Daily Overview Report</h1>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
        <div class="content">
          <div class="metric">
            <div class="metric-title">Total Vehicles</div>
            <div class="metric-value">${data.vehicles?.total || 0}</div>
          </div>
          <div class="metric">
            <div class="metric-title">Total Auctions</div>
            <div class="metric-value">${data.auctions?.total || 0}</div>
          </div>
          <div class="metric">
            <div class="metric-title">Total Users</div>
            <div class="metric-value">${data.users?.total || 0}</div>
          </div>
          <div class="metric">
            <div class="metric-title">Active Memberships</div>
            <div class="metric-value">${data.memberships?.total || 0}</div>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated report from Tractor Auction Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Daily Overview Report - ${new Date().toLocaleDateString()}

Total Vehicles: ${data.vehicles?.total || 0}
Total Auctions: ${data.auctions?.total || 0}
Total Users: ${data.users?.total || 0}
Active Memberships: ${data.memberships?.total || 0}

This is an automated report from Tractor Auction Platform.
  `;
  
  return { subject, html, text };
}

export function generateFinancialReportEmail(data: any, period: string): { subject: string; html: string; text: string } {
  const subject = `${period.charAt(0).toUpperCase() + period.slice(1)} Financial Report - Tractor Auction Platform`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .metric { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .metric-title { font-weight: bold; color: #666; font-size: 14px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #10b981; margin-top: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Financial Report</h1>
          <p>Period: ${period} | ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="content">
          <div class="metric">
            <div class="metric-title">Total Revenue</div>
            <div class="metric-value">₹${Math.round(data.summary?.totalRevenue || 0).toLocaleString("en-IN")}</div>
          </div>
          <div class="metric">
            <div class="metric-title">Membership Revenue</div>
            <div class="metric-value">₹${Math.round(data.summary?.membershipRevenue || 0).toLocaleString("en-IN")}</div>
          </div>
          <div class="metric">
            <div class="metric-title">Auction Revenue</div>
            <div class="metric-value">₹${Math.round(data.summary?.auctionRevenue || 0).toLocaleString("en-IN")}</div>
          </div>
          <div class="metric">
            <div class="metric-title">Pre-approved Sales Revenue</div>
            <div class="metric-value">₹${Math.round(data.summary?.preApprovedRevenue || 0).toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated report from Tractor Auction Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Financial Report - ${period}
${new Date().toLocaleDateString()}

Total Revenue: ₹${Math.round(data.summary?.totalRevenue || 0).toLocaleString("en-IN")}
Membership Revenue: ₹${Math.round(data.summary?.membershipRevenue || 0).toLocaleString("en-IN")}
Auction Revenue: ₹${Math.round(data.summary?.auctionRevenue || 0).toLocaleString("en-IN")}
Pre-approved Sales Revenue: ₹${Math.round(data.summary?.preApprovedRevenue || 0).toLocaleString("en-IN")}

This is an automated report from Tractor Auction Platform.
  `;
  
  return { subject, html, text };
}

export function generatePerformanceReportEmail(data: any): { subject: string; html: string; text: string } {
  const subject = "Performance Metrics Report - Tractor Auction Platform";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .metric { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .metric-title { font-weight: bold; color: #666; font-size: 14px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #8b5cf6; margin-top: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Performance Metrics Report</h1>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
        <div class="content">
          <div class="metric">
            <div class="metric-title">Approval Rate</div>
            <div class="metric-value">${data.conversionRates?.approvalRate || 0}%</div>
          </div>
          <div class="metric">
            <div class="metric-title">Sale Conversion Rate</div>
            <div class="metric-value">${data.conversionRates?.saleConversionRate || 0}%</div>
          </div>
          <div class="metric">
            <div class="metric-title">Auction Completion Rate</div>
            <div class="metric-value">${data.auctionPerformance?.completionRate || 0}%</div>
          </div>
          <div class="metric">
            <div class="metric-title">Bid Approval Rate</div>
            <div class="metric-value">${data.auctionPerformance?.bidApprovalRate || 0}%</div>
          </div>
          <div class="metric">
            <div class="metric-title">Average Bids per Auction</div>
            <div class="metric-value">${data.auctionPerformance?.avgBidsPerAuction || 0}</div>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated report from Tractor Auction Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Performance Metrics Report - ${new Date().toLocaleDateString()}

Approval Rate: ${data.conversionRates?.approvalRate || 0}%
Sale Conversion Rate: ${data.conversionRates?.saleConversionRate || 0}%
Auction Completion Rate: ${data.auctionPerformance?.completionRate || 0}%
Bid Approval Rate: ${data.auctionPerformance?.bidApprovalRate || 0}%
Average Bids per Auction: ${data.auctionPerformance?.avgBidsPerAuction || 0}

This is an automated report from Tractor Auction Platform.
  `;
  
  return { subject, html, text };
}




























