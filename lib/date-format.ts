/**
 * Format date to "24th December 2025" format
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string (e.g., "24th December 2025")
 */
export function formatDate(date: string | Date | number): string {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const day = dateObj.getDate();
  const month = dateObj.toLocaleString("en-US", { month: "long" });
  const year = dateObj.getFullYear();

  // Get ordinal suffix (st, nd, rd, th)
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return "th"; // 4th, 5th, ..., 20th
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const ordinal = getOrdinalSuffix(day);

  return `${day}${ordinal} ${month} ${year}`;
}

/**
 * Format date and time to "24th December 2025, 10:30 AM" format
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date | number): string {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const datePart = formatDate(dateObj);
  const timePart = dateObj.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}

/**
 * Format date to "24th December 2025, 10:30 AM - 11:30 AM" format for time ranges
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string | Date | number, endDate: string | Date | number): string {
  const start = typeof startDate === "string" || typeof startDate === "number" 
    ? new Date(startDate) 
    : startDate;
  const end = typeof endDate === "string" || typeof endDate === "number" 
    ? new Date(endDate) 
    : endDate;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "Invalid Date Range";
  }

  const startDatePart = formatDate(start);
  const startTime = start.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const endTime = end.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // If same day, show: "24th December 2025, 10:30 AM - 11:30 AM"
  if (startDatePart === formatDate(end)) {
    return `${startDatePart}, ${startTime} - ${endTime}`;
  }

  // If different days, show: "24th December 2025, 10:30 AM - 25th December 2025, 11:30 AM"
  return `${startDatePart}, ${startTime} - ${formatDate(end)}, ${endTime}`;
}





























