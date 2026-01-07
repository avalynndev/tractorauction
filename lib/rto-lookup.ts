/**
 * RTO (Regional Transport Office) Lookup Utility
 * Extracts RTO information from Indian vehicle registration numbers
 */

interface RTODetails {
  rtoName: string;
  state: string;
  city: string;
  rtoCode: string;
}

// RTO Code to Details Mapping (Common RTOs)
const rtoMapping: Record<string, RTODetails> = {
  // Andhra Pradesh
  "AP01": { rtoName: "Anantapur", state: "Andhra Pradesh", city: "Anantapur", rtoCode: "AP01" },
  "AP02": { rtoName: "Chittoor", state: "Andhra Pradesh", city: "Chittoor", rtoCode: "AP02" },
  "AP03": { rtoName: "East Godavari", state: "Andhra Pradesh", city: "Kakinada", rtoCode: "AP03" },
  "AP04": { rtoName: "Guntur", state: "Andhra Pradesh", city: "Guntur", rtoCode: "AP04" },
  "AP05": { rtoName: "Krishna", state: "Andhra Pradesh", city: "Vijayawada", rtoCode: "AP05" },
  "AP07": { rtoName: "Nellore", state: "Andhra Pradesh", city: "Nellore", rtoCode: "AP07" },
  "AP09": { rtoName: "Prakasam", state: "Andhra Pradesh", city: "Ongole", rtoCode: "AP09" },
  "AP10": { rtoName: "Srikakulam", state: "Andhra Pradesh", city: "Srikakulam", rtoCode: "AP10" },
  "AP11": { rtoName: "Visakhapatnam", state: "Andhra Pradesh", city: "Visakhapatnam", rtoCode: "AP11" },
  "AP12": { rtoName: "Vizianagaram", state: "Andhra Pradesh", city: "Vizianagaram", rtoCode: "AP12" },
  "AP13": { rtoName: "West Godavari", state: "Andhra Pradesh", city: "Eluru", rtoCode: "AP13" },
  "AP16": { rtoName: "Kurnool", state: "Andhra Pradesh", city: "Kurnool", rtoCode: "AP16" },
  "AP18": { rtoName: "Kadapa", state: "Andhra Pradesh", city: "Kadapa", rtoCode: "AP18" },
  "AP21": { rtoName: "Srikakulam", state: "Andhra Pradesh", city: "Srikakulam", rtoCode: "AP21" },
  "AP23": { rtoName: "Prakasam", state: "Andhra Pradesh", city: "Ongole", rtoCode: "AP23" },
  "AP24": { rtoName: "Nellore", state: "Andhra Pradesh", city: "Nellore", rtoCode: "AP24" },
  "AP26": { rtoName: "Chittoor", state: "Andhra Pradesh", city: "Chittoor", rtoCode: "AP26" },
  "AP27": { rtoName: "Anantapur", state: "Andhra Pradesh", city: "Anantapur", rtoCode: "AP27" },
  "AP28": { rtoName: "Kurnool", state: "Andhra Pradesh", city: "Kurnool", rtoCode: "AP28" },
  "AP29": { rtoName: "Kadapa", state: "Andhra Pradesh", city: "Kadapa", rtoCode: "AP29" },
  "AP30": { rtoName: "Anantapur", state: "Andhra Pradesh", city: "Anantapur", rtoCode: "AP30" },
  "AP31": { rtoName: "Guntur", state: "Andhra Pradesh", city: "Guntur", rtoCode: "AP31" },
  "AP32": { rtoName: "Krishna", state: "Andhra Pradesh", city: "Vijayawada", rtoCode: "AP32" },
  "AP33": { rtoName: "West Godavari", state: "Andhra Pradesh", city: "Eluru", rtoCode: "AP33" },
  "AP34": { rtoName: "East Godavari", state: "Andhra Pradesh", city: "Kakinada", rtoCode: "AP34" },
  "AP35": { rtoName: "Visakhapatnam", state: "Andhra Pradesh", city: "Visakhapatnam", rtoCode: "AP35" },
  "AP36": { rtoName: "Vizianagaram", state: "Andhra Pradesh", city: "Vizianagaram", rtoCode: "AP36" },
  "AP37": { rtoName: "Srikakulam", state: "Andhra Pradesh", city: "Srikakulam", rtoCode: "AP37" },
  
  // Karnataka
  "KA01": { rtoName: "Bangalore Central", state: "Karnataka", city: "Bangalore", rtoCode: "KA01" },
  "KA02": { rtoName: "Bangalore West", state: "Karnataka", city: "Bangalore", rtoCode: "KA02" },
  "KA03": { rtoName: "Bangalore East", state: "Karnataka", city: "Bangalore", rtoCode: "KA03" },
  "KA04": { rtoName: "Bangalore North", state: "Karnataka", city: "Bangalore", rtoCode: "KA04" },
  "KA05": { rtoName: "Bangalore South", state: "Karnataka", city: "Bangalore", rtoCode: "KA05" },
  "KA09": { rtoName: "Mysore", state: "Karnataka", city: "Mysore", rtoCode: "KA09" },
  "KA19": { rtoName: "Mangalore", state: "Karnataka", city: "Mangalore", rtoCode: "KA19" },
  "KA41": { rtoName: "Belgaum", state: "Karnataka", city: "Belgaum", rtoCode: "KA41" },
  
  // Maharashtra
  "MH01": { rtoName: "Mumbai Central", state: "Maharashtra", city: "Mumbai", rtoCode: "MH01" },
  "MH02": { rtoName: "Mumbai West", state: "Maharashtra", city: "Mumbai", rtoCode: "MH02" },
  "MH03": { rtoName: "Mumbai East", state: "Maharashtra", city: "Mumbai", rtoCode: "MH03" },
  "MH12": { rtoName: "Pune", state: "Maharashtra", city: "Pune", rtoCode: "MH12" },
  "MH31": { rtoName: "Nagpur", state: "Maharashtra", city: "Nagpur", rtoCode: "MH31" },
  "MH43": { rtoName: "Nashik", state: "Maharashtra", city: "Nashik", rtoCode: "MH43" },
  
  // Tamil Nadu
  "TN01": { rtoName: "Chennai Central", state: "Tamil Nadu", city: "Chennai", rtoCode: "TN01" },
  "TN02": { rtoName: "Chennai North", state: "Tamil Nadu", city: "Chennai", rtoCode: "TN02" },
  "TN03": { rtoName: "Chennai South", state: "Tamil Nadu", city: "Chennai", rtoCode: "TN03" },
  "TN09": { rtoName: "Coimbatore", state: "Tamil Nadu", city: "Coimbatore", rtoCode: "TN09" },
  "TN13": { rtoName: "Madurai", state: "Tamil Nadu", city: "Madurai", rtoCode: "TN13" },
  
  // Gujarat
  "GJ01": { rtoName: "Ahmedabad", state: "Gujarat", city: "Ahmedabad", rtoCode: "GJ01" },
  "GJ02": { rtoName: "Vadodara", state: "Gujarat", city: "Vadodara", rtoCode: "GJ02" },
  "GJ03": { rtoName: "Surat", state: "Gujarat", city: "Surat", rtoCode: "GJ03" },
  "GJ06": { rtoName: "Rajkot", state: "Gujarat", city: "Rajkot", rtoCode: "GJ06" },
  
  // Uttar Pradesh
  "UP14": { rtoName: "Lucknow", state: "Uttar Pradesh", city: "Lucknow", rtoCode: "UP14" },
  "UP15": { rtoName: "Kanpur", state: "Uttar Pradesh", city: "Kanpur", rtoCode: "UP15" },
  "UP16": { rtoName: "Varanasi", state: "Uttar Pradesh", city: "Varanasi", rtoCode: "UP16" },
  "UP78": { rtoName: "Noida", state: "Uttar Pradesh", city: "Noida", rtoCode: "UP78" },
  
  // Delhi
  "DL01": { rtoName: "Central Delhi", state: "Delhi", city: "New Delhi", rtoCode: "DL01" },
  "DL02": { rtoName: "North Delhi", state: "Delhi", city: "New Delhi", rtoCode: "DL02" },
  "DL03": { rtoName: "South Delhi", state: "Delhi", city: "New Delhi", rtoCode: "DL03" },
  "DL04": { rtoName: "East Delhi", state: "Delhi", city: "New Delhi", rtoCode: "DL04" },
  "DL05": { rtoName: "West Delhi", state: "Delhi", city: "New Delhi", rtoCode: "DL05" },
  
  // Telangana
  "TS01": { rtoName: "Hyderabad Central", state: "Telangana", city: "Hyderabad", rtoCode: "TS01" },
  "TS02": { rtoName: "Hyderabad West", state: "Telangana", city: "Hyderabad", rtoCode: "TS02" },
  "TS07": { rtoName: "Warangal", state: "Telangana", city: "Warangal", rtoCode: "TS07" },
  "TS09": { rtoName: "Karimnagar", state: "Telangana", city: "Karimnagar", rtoCode: "TS09" },
  
  // Kerala
  "KL01": { rtoName: "Thiruvananthapuram", state: "Kerala", city: "Thiruvananthapuram", rtoCode: "KL01" },
  "KL02": { rtoName: "Kollam", state: "Kerala", city: "Kollam", rtoCode: "KL02" },
  "KL07": { rtoName: "Kochi", state: "Kerala", city: "Kochi", rtoCode: "KL07" },
  "KL08": { rtoName: "Kozhikode", state: "Kerala", city: "Kozhikode", rtoCode: "KL08" },
  
  // Punjab
  "PB01": { rtoName: "Amritsar", state: "Punjab", city: "Amritsar", rtoCode: "PB01" },
  "PB02": { rtoName: "Ludhiana", state: "Punjab", city: "Ludhiana", rtoCode: "PB02" },
  "PB03": { rtoName: "Jalandhar", state: "Punjab", city: "Jalandhar", rtoCode: "PB03" },
  "PB10": { rtoName: "Patiala", state: "Punjab", city: "Patiala", rtoCode: "PB10" },
  
  // Rajasthan
  "RJ01": { rtoName: "Jaipur", state: "Rajasthan", city: "Jaipur", rtoCode: "RJ01" },
  "RJ02": { rtoName: "Jodhpur", state: "Rajasthan", city: "Jodhpur", rtoCode: "RJ02" },
  "RJ14": { rtoName: "Udaipur", state: "Rajasthan", city: "Udaipur", rtoCode: "RJ14" },
  "RJ20": { rtoName: "Kota", state: "Rajasthan", city: "Kota", rtoCode: "RJ20" },
  
  // West Bengal
  "WB01": { rtoName: "Kolkata Central", state: "West Bengal", city: "Kolkata", rtoCode: "WB01" },
  "WB02": { rtoName: "Kolkata North", state: "West Bengal", city: "Kolkata", rtoCode: "WB02" },
  "WB03": { rtoName: "Kolkata South", state: "West Bengal", city: "Kolkata", rtoCode: "WB03" },
  "WB11": { rtoName: "Howrah", state: "West Bengal", city: "Howrah", rtoCode: "WB11" },
  
  // Haryana
  "HR01": { rtoName: "Ambala", state: "Haryana", city: "Ambala", rtoCode: "HR01" },
  "HR12": { rtoName: "Faridabad", state: "Haryana", city: "Faridabad", rtoCode: "HR12" },
  "HR26": { rtoName: "Gurgaon", state: "Haryana", city: "Gurgaon", rtoCode: "HR26" },
  "HR55": { rtoName: "Panipat", state: "Haryana", city: "Panipat", rtoCode: "HR55" },
  
  // Note: This is a sample mapping. For production, you should use a comprehensive RTO database
  // or integrate with an external RTO lookup API service
};

/**
 * Extract RTO code from registration number
 * Format: XX##XX#### (e.g., AP01AB1234)
 */
export function extractRTOCode(registrationNumber: string): string | null {
  if (!registrationNumber || registrationNumber.length < 4) {
    return null;
  }

  // Remove spaces and convert to uppercase
  const regNum = registrationNumber.replace(/\s/g, "").toUpperCase();

  // Extract first 4 characters (state code + RTO number)
  const rtoCode = regNum.substring(0, 4);
  
  // Validate format (2 letters + 2 digits)
  if (/^[A-Z]{2}\d{2}$/.test(rtoCode)) {
    return rtoCode;
  }

  return null;
}

/**
 * Get RTO details from registration number
 */
export function getRTODetails(registrationNumber: string): RTODetails | null {
  const rtoCode = extractRTOCode(registrationNumber);
  if (!rtoCode) {
    return null;
  }

  return rtoMapping[rtoCode] || null;
}

/**
 * Get RTO details from chassis number (if available in future)
 */
export function getRTODetailsFromChassis(chassisNumber: string): RTODetails | null {
  // Chassis number lookup can be implemented if needed
  // For now, return null
  return null;
}

/**
 * Get RTO details from engine number (if available in future)
 */
export function getRTODetailsFromEngine(engineNumber: string): RTODetails | null {
  // Engine number lookup can be implemented if needed
  // For now, return null
  return null;
}

export type { RTODetails };

