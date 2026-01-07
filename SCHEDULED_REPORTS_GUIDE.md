# Scheduled Reports & Email Summaries Guide

This guide explains how to set up and use scheduled reports for the Tractor Auction Platform.

## Overview

Scheduled reports allow administrators to automatically receive daily, weekly, or monthly summaries of platform activity via SMS or email. This feature helps keep admins informed about key metrics without manually checking the dashboard.

## Features

- **Report Types**: Overview, Financial, Performance
- **Frequencies**: Daily, Weekly, Monthly
- **Delivery Methods**: SMS, Email (email requires additional setup)
- **Automated**: Can be triggered via cron jobs or scheduled tasks

## API Endpoints

### 1. Get Available Report Types and Frequencies

**GET** `/api/admin/reports/scheduled`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "reportTypes": [
    { "value": "overview", "label": "Overview Report" },
    { "value": "financial", "label": "Financial Report" },
    { "value": "performance", "label": "Performance Report" }
  ],
  "frequencies": [
    { "value": "daily", "label": "Daily" },
    { "value": "weekly", "label": "Weekly" },
    { "value": "monthly", "label": "Monthly" }
  ]
}
```

### 2. Generate and Send Scheduled Report

**POST** `/api/admin/reports/scheduled`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "reportType": "overview",
  "frequency": "daily",
  "email": "admin@example.com",
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "message": "Report generated and sent successfully",
  "reportType": "overview",
  "frequency": "daily",
  "sentTo": {
    "email": "admin@example.com",
    "phone": "+919876543210"
  }
}
```

## Setting Up Scheduled Reports

### Option 1: Using Cron Jobs (Linux/Mac)

1. **Create a cron job script** (`scripts/send-scheduled-report.sh`):

```bash
#!/bin/bash

# Get admin token (you'll need to store this securely)
ADMIN_TOKEN="your_admin_token_here"

# Send daily overview report
curl -X POST http://localhost:3000/api/admin/reports/scheduled \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "overview",
    "frequency": "daily",
    "email": "admin@example.com",
    "phone": "+919876543210"
  }'
```

2. **Make the script executable:**
```bash
chmod +x scripts/send-scheduled-report.sh
```

3. **Add to crontab** (run daily at 9 AM):
```bash
crontab -e
```

Add this line:
```
0 9 * * * /path/to/your/project/scripts/send-scheduled-report.sh
```

### Option 2: Using Windows Task Scheduler

1. **Create a PowerShell script** (`scripts/send-scheduled-report.ps1`):

```powershell
$adminToken = "your_admin_token_here"
$body = @{
    reportType = "overview"
    frequency = "daily"
    email = "admin@example.com"
    phone = "+919876543210"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/reports/scheduled" `
    -Method POST `
    -Headers @{ "Authorization" = "Bearer $adminToken"; "Content-Type" = "application/json" } `
    -Body $body
```

2. **Create a scheduled task in Windows Task Scheduler:**
   - Open Task Scheduler
   - Create Basic Task
   - Set trigger (daily at 9 AM)
   - Set action to run PowerShell script
   - Point to `scripts/send-scheduled-report.ps1`

### Option 3: Using Node.js Cron Library

1. **Install node-cron:**
```bash
npm install node-cron
```

2. **Create a cron job file** (`scripts/scheduled-reports-cron.ts`):

```typescript
import cron from "node-cron";
import fetch from "node-fetch";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

// Run daily at 9 AM
cron.schedule("0 9 * * *", async () => {
  try {
    const response = await fetch("http://localhost:3000/api/admin/reports/scheduled", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportType: "overview",
        frequency: "daily",
        email: process.env.ADMIN_EMAIL,
        phone: process.env.ADMIN_PHONE,
      }),
    });

    const data = await response.json();
    console.log("Scheduled report sent:", data);
  } catch (error) {
    console.error("Error sending scheduled report:", error);
  }
});

// Run weekly on Monday at 9 AM
cron.schedule("0 9 * * 1", async () => {
  // Send weekly financial report
  // Similar implementation...
});

// Run monthly on the 1st at 9 AM
cron.schedule("0 9 1 * *", async () => {
  // Send monthly performance report
  // Similar implementation...
});
```

3. **Run the cron job:**
```bash
npx tsx scripts/scheduled-reports-cron.ts
```

## Email Integration (Optional)

To enable email delivery, you'll need to integrate an email service provider. Here are some options:

### Option 1: SendGrid

1. **Install SendGrid:**
```bash
npm install @sendgrid/mail
```

2. **Update the scheduled reports API** to use SendGrid:

```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// In the POST handler:
if (email) {
  const emailTemplate = generateFinancialReportEmail(reportData, period);
  await sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
  });
}
```

### Option 2: Nodemailer (SMTP)

1. **Install Nodemailer:**
```bash
npm install nodemailer
```

2. **Configure and use Nodemailer** in the scheduled reports API.

## Environment Variables

Add these to your `.env` file:

```env
# For scheduled reports
ADMIN_TOKEN=your_admin_jwt_token
ADMIN_EMAIL=admin@example.com
ADMIN_PHONE=+919876543210

# For email service (if using SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@tractorauction.in

# Base URL for API calls
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Report Content

### Overview Report
- Total vehicles
- Total auctions
- Total users
- Active memberships

### Financial Report
- Total revenue
- Membership revenue
- Auction revenue
- Pre-approved sales revenue

### Performance Report
- Approval rates
- Conversion rates
- Auction completion rates
- Average bids per auction
- Time metrics

## Security Considerations

1. **Store admin token securely**: Never commit tokens to version control. Use environment variables or secure vaults.

2. **Rate limiting**: Consider implementing rate limiting on the scheduled reports endpoint to prevent abuse.

3. **Authentication**: The endpoint requires admin authentication. Ensure your cron jobs use valid admin tokens.

4. **Phone number validation**: The SMS service validates phone numbers. Ensure phone numbers are in the correct format.

## Troubleshooting

### Reports not being sent

1. **Check SMS configuration**: Ensure SMS service (MSG91/TextLocal) is properly configured in `.env`.

2. **Verify admin token**: Ensure the admin token used in cron jobs is valid and not expired.

3. **Check server logs**: Look for errors in the server console when the cron job runs.

4. **Test manually**: Use Postman or curl to test the API endpoint directly.

### Email not working

1. **Email service not configured**: Email functionality requires additional setup (SendGrid, Nodemailer, etc.).

2. **Check email templates**: Ensure email templates are generating correctly.

3. **Verify email address**: Ensure the recipient email address is valid.

## Next Steps

1. Set up cron jobs or scheduled tasks based on your server environment.
2. Configure email service if you want email delivery.
3. Customize report content by modifying the API endpoints.
4. Add more report types as needed.

## Support

For issues or questions, check the main project documentation or contact the development team.
