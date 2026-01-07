// Translation keys and values for all supported languages

export type Language = 
  | "en" // English
  | "hi" // Hindi
  | "te" // Telugu
  | "ta" // Tamil
  | "kn" // Kannada
  | "mr" // Marathi
  | "pa" // Punjabi
  | "gu" // Gujarati
  | "or" // Odia
  | "bn"; // Bengali

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.auctions": "Auctions",
    "nav.preApproved": "Pre-Approved",
    "nav.contact": "Contact",
    "nav.myAccount": "My Account",
    "nav.signOut": "Sign Out",
    "nav.language": "Language",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.back": "Back",
    "common.next": "Next",
    "common.submit": "Submit",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.close": "Close",
    "common.yes": "Yes",
    "common.no": "No",
    
    // Homepage
    "home.title": "India's #1 Tractor Auction Platform",
    "home.subtitle": "Buy & Sell Tractors, Harvesters & Scrap Vehicles",
    "home.description": "Trusted by 2000+ Buyers & 500+ Sellers Across India",
    "home.registerNow": "Start Free - Register Now",
    "home.viewAuctions": "View Live Auctions",
    "home.preApprovedVehicles": "Pre-Approved Vehicles",
    "home.sellVehicle": "Sell Your Vehicle",
    "home.callUs": "Call: 7801094747",
    
    // Auctions
    "auctions.live": "Live Auctions",
    "auctions.upcoming": "Upcoming Auctions",
    "auctions.ended": "Ended Auctions",
    "auctions.placeBid": "Place Bid",
    "auctions.currentBid": "Current Bid",
    "auctions.minimumBid": "Minimum Bid",
    "auctions.reservePrice": "Reserve Price",
    "auctions.timeRemaining": "Time Remaining",
    "auctions.biddingActive": "Bidding Active",
    "auctions.totalBids": "Total Bids",
    "auctions.winningBid": "Winning Bid",
    
    // My Account
    "account.welcome": "Welcome",
    "account.personalDetails": "Personal Details",
    "account.myVehicles": "My Vehicles",
    "account.myBids": "My Bids",
    "account.myPurchases": "My Purchases",
    "account.membership": "Membership",
    "account.kycVerification": "KYC Verification",
    
    // Forms
    "form.fullName": "Full Name",
    "form.phoneNumber": "Phone Number",
    "form.email": "Email",
    "form.address": "Address",
    "form.city": "City",
    "form.state": "State",
    "form.district": "District",
    "form.pincode": "Pincode",
    "form.required": "This field is required",
    
    // Buttons
    "btn.login": "Sign In",
    "btn.register": "Register",
    "btn.logout": "Logout",
    "btn.upload": "Upload",
    "btn.download": "Download",
    "btn.continue": "Continue",
    "btn.finish": "Finish",
  },
  
  hi: {
    // Navigation
    "nav.home": "होम",
    "nav.auctions": "नीलामी",
    "nav.preApproved": "पूर्व-अनुमोदित",
    "nav.contact": "संपर्क करें",
    "nav.myAccount": "मेरा खाता",
    "nav.signOut": "साइन आउट",
    "nav.language": "भाषा",
    
    // Common
    "common.loading": "लोड हो रहा है...",
    "common.error": "त्रुटि",
    "common.success": "सफल",
    "common.save": "सहेजें",
    "common.cancel": "रद्द करें",
    "common.delete": "हटाएं",
    "common.edit": "संपादित करें",
    "common.view": "देखें",
    "common.back": "वापस",
    "common.next": "अगला",
    "common.submit": "जमा करें",
    "common.search": "खोजें",
    "common.filter": "फ़िल्टर",
    "common.close": "बंद करें",
    "common.yes": "हाँ",
    "common.no": "नहीं",
    
    // Homepage
    "home.title": "भारत का #1 ट्रैक्टर नीलामी प्लेटफॉर्म",
    "home.subtitle": "ट्रैक्टर, हार्वेस्टर और स्क्रैप वाहन खरीदें और बेचें",
    "home.description": "भारत भर में 2000+ खरीदारों और 500+ विक्रेताओं द्वारा विश्वसनीय",
    "home.registerNow": "मुफ्त शुरू करें - अभी पंजीकरण करें",
    "home.viewAuctions": "लाइव नीलामी देखें",
    "home.preApprovedVehicles": "पूर्व-अनुमोदित वाहन",
    "home.sellVehicle": "अपना वाहन बेचें",
    "home.callUs": "कॉल करें: 7801094747",
    
    // Auctions
    "auctions.live": "लाइव नीलामी",
    "auctions.upcoming": "आगामी नीलामी",
    "auctions.ended": "समाप्त नीलामी",
    "auctions.placeBid": "बोली लगाएं",
    "auctions.currentBid": "वर्तमान बोली",
    "auctions.minimumBid": "न्यूनतम बोली",
    "auctions.reservePrice": "आरक्षित मूल्य",
    "auctions.timeRemaining": "शेष समय",
    "auctions.biddingActive": "बोली सक्रिय",
    "auctions.totalBids": "कुल बोलियां",
    "auctions.winningBid": "जीतने वाली बोली",
    
    // My Account
    "account.welcome": "स्वागत है",
    "account.personalDetails": "व्यक्तिगत विवरण",
    "account.myVehicles": "मेरे वाहन",
    "account.myBids": "मेरी बोलियां",
    "account.myPurchases": "मेरी खरीदारी",
    "account.membership": "सदस्यता",
    "account.kycVerification": "KYC सत्यापन",
    
    // Forms
    "form.fullName": "पूरा नाम",
    "form.phoneNumber": "फोन नंबर",
    "form.email": "ईमेल",
    "form.address": "पता",
    "form.city": "शहर",
    "form.state": "राज्य",
    "form.district": "जिला",
    "form.pincode": "पिन कोड",
    "form.required": "यह फ़ील्ड आवश्यक है",
    
    // Buttons
    "btn.login": "लॉगिन",
    "btn.register": "पंजीकरण करें",
    "btn.logout": "लॉगआउट",
    "btn.upload": "अपलोड करें",
    "btn.download": "डाउनलोड करें",
    "btn.continue": "जारी रखें",
    "btn.finish": "समाप्त करें",
  },
  
  te: {
    // Navigation
    "nav.home": "హోమ్",
    "nav.auctions": "వేలం",
    "nav.preApproved": "ముందుగా ఆమోదించబడిన",
    "nav.contact": "సంప్రదించండి",
    "nav.myAccount": "నా ఖాతా",
    "nav.signOut": "సైన్ అవుట్",
    "nav.language": "భాష",
    
    // Common
    "common.loading": "లోడ్ అవుతోంది...",
    "common.error": "దోషం",
    "common.success": "విజయం",
    "common.save": "సేవ్ చేయి",
    "common.cancel": "రద్దు చేయి",
    "common.delete": "తొలగించు",
    "common.edit": "సవరించు",
    "common.view": "చూడు",
    "common.back": "వెనక్కి",
    "common.next": "తర్వాత",
    "common.submit": "సమర్పించు",
    "common.search": "శోధించు",
    "common.filter": "ఫిల్టర్",
    "common.close": "మూసివేయి",
    "common.yes": "అవును",
    "common.no": "కాదు",
    
    // Homepage
    "home.title": "భారతదేశం యొక్క #1 ట్రాక్టర్ వేలం ప్లాట్‌ఫార్మ్",
    "home.subtitle": "ట్రాక్టర్లు, హార్వెస్టర్లు మరియు స్క్రాప్ వాహనాలను కొనండి మరియు విక్రయించండి",
    "home.description": "భారతదేశం అంతటా 2000+ కొనుగోలుదారులు మరియు 500+ విక్రేతలచే నమ్మకమైనది",
    "home.registerNow": "ఉచితంగా ప్రారంభించండి - ఇప్పుడే నమోదు చేయండి",
    "home.viewAuctions": "లైవ్ వేలాలను వీక్షించండి",
    "home.preApprovedVehicles": "ముందుగా ఆమోదించబడిన వాహనాలు",
    "home.sellVehicle": "మీ వాహనాన్ని విక్రయించండి",
    "home.callUs": "కాల్ చేయండి: 7801094747",
    
    // Auctions
    "auctions.live": "లైవ్ వేలాలు",
    "auctions.upcoming": "రాబోయే వేలాలు",
    "auctions.ended": "ముగిసిన వేలాలు",
    "auctions.placeBid": "బిడ్ చేయండి",
    "auctions.currentBid": "ప్రస్తుత బిడ్",
    "auctions.minimumBid": "కనిష్ట బిడ్",
    "auctions.reservePrice": "రిజర్వ్ ధర",
    "auctions.timeRemaining": "మిగిలిన సమయం",
    "auctions.biddingActive": "బిడ్డింగ్ సక్రియం",
    "auctions.totalBids": "మొత్తం బిడ్లు",
    "auctions.winningBid": "గెలిచిన బిడ్",
    
    // My Account
    "account.welcome": "స్వాగతం",
    "account.personalDetails": "వ్యక్తిగత వివరాలు",
    "account.myVehicles": "నా వాహనాలు",
    "account.myBids": "నా బిడ్లు",
    "account.myPurchases": "నా కొనుగోలులు",
    "account.membership": "సభ్యత్వం",
    "account.kycVerification": "KYC ధృవీకరణ",
    
    // Forms
    "form.fullName": "పూర్తి పేరు",
    "form.phoneNumber": "ఫోన్ నంబర్",
    "form.email": "ఇమెయిల్",
    "form.address": "చిరునామా",
    "form.city": "నగరం",
    "form.state": "రాష్ట్రం",
    "form.district": "జిల్లా",
    "form.pincode": "పిన్ కోడ్",
    "form.required": "ఈ ఫీల్డ్ అవసరం",
    
    // Buttons
    "btn.login": "లాగిన్",
    "btn.register": "నమోదు చేయండి",
    "btn.logout": "లాగ్అవుట్",
    "btn.upload": "అప్‌లోడ్ చేయండి",
    "btn.download": "డౌన్‌లోడ్ చేయండి",
    "btn.continue": "కొనసాగించు",
    "btn.finish": "ముగించు",
  },
  
  ta: {
    // Navigation
    "nav.home": "வீடு",
    "nav.auctions": "ஏலம்",
    "nav.preApproved": "முன்பே அனுமதிக்கப்பட்டது",
    "nav.contact": "தொடர்பு",
    "nav.myAccount": "என் கணக்கு",
    "nav.signOut": "வெளியேற",
    "nav.language": "மொழி",
    
    // Common
    "common.loading": "ஏற்றுகிறது...",
    "common.error": "பிழை",
    "common.success": "வெற்றி",
    "common.save": "சேமி",
    "common.cancel": "ரத்துசெய்",
    "common.delete": "நீக்கு",
    "common.edit": "திருத்து",
    "common.view": "காண்க",
    "common.back": "பின்",
    "common.next": "அடுத்து",
    "common.submit": "சமர்ப்பி",
    "common.search": "தேடு",
    "common.filter": "வடிகட்டி",
    "common.close": "மூடு",
    "common.yes": "ஆம்",
    "common.no": "இல்லை",
    
    // Homepage
    "home.title": "இந்தியாவின் #1 டிராக்டர் ஏலம் தளம்",
    "home.subtitle": "டிராக்டர்கள், அறுவடை இயந்திரங்கள் மற்றும் குப்பை வாகனங்களை வாங்கவும் விற்கவும்",
    "home.description": "இந்தியா முழுவதும் 2000+ வாங்குபவர்கள் மற்றும் 500+ விற்பனையாளர்களால் நம்பப்படுகிறது",
    "home.registerNow": "இலவசமாக தொடங்க - இப்போது பதிவு செய்யுங்கள்",
    "home.viewAuctions": "நேரடி ஏலங்களைக் காண்க",
    "home.preApprovedVehicles": "முன்பே அனுமதிக்கப்பட்ட வாகனங்கள்",
    "home.sellVehicle": "உங்கள் வாகனத்தை விற்கவும்",
    "home.callUs": "அழை: 7801094747",
    
    // Auctions
    "auctions.live": "நேரடி ஏலங்கள்",
    "auctions.upcoming": "வரவிருக்கும் ஏலங்கள்",
    "auctions.ended": "முடிந்த ஏலங்கள்",
    "auctions.placeBid": "ஏலம் வை",
    "auctions.currentBid": "தற்போதைய ஏலம்",
    "auctions.minimumBid": "குறைந்தபட்ச ஏலம்",
    "auctions.reservePrice": "ஒதுக்கப்பட்ட விலை",
    "auctions.timeRemaining": "மீதமுள்ள நேரம்",
    "auctions.biddingActive": "ஏலம் செயலில்",
    "auctions.totalBids": "மொத்த ஏலங்கள்",
    "auctions.winningBid": "வெற்றி ஏலம்",
    
    // My Account
    "account.welcome": "வரவேற்கிறோம்",
    "account.personalDetails": "தனிப்பட்ட விவரங்கள்",
    "account.myVehicles": "என் வாகனங்கள்",
    "account.myBids": "என் ஏலங்கள்",
    "account.myPurchases": "என் கொள்முதல்",
    "account.membership": "உறுப்பினர்",
    "account.kycVerification": "KYC சரிபார்ப்பு",
    
    // Forms
    "form.fullName": "முழு பெயர்",
    "form.phoneNumber": "தொலைபேசி எண்",
    "form.email": "மின்னஞ்சல்",
    "form.address": "முகவரி",
    "form.city": "நகரம்",
    "form.state": "மாநிலம்",
    "form.district": "மாவட்டம்",
    "form.pincode": "அஞ்சல் குறியீடு",
    "form.required": "இந்த புலம் தேவையானது",
    
    // Buttons
    "btn.login": "உள்நுழை",
    "btn.register": "பதிவு செய்",
    "btn.logout": "வெளியேற",
    "btn.upload": "பதிவேற்று",
    "btn.download": "பதிவிறக்க",
    "btn.continue": "தொடர்",
    "btn.finish": "முடி",
  },
  
  kn: {
    // Navigation
    "nav.home": "ಮುಖಪುಟ",
    "nav.auctions": "ಏಲಾಂ",
    "nav.preApproved": "ಮುಂಚಿತವಾಗಿ ಅನುಮೋದಿಸಲಾಗಿದೆ",
    "nav.contact": "ಸಂಪರ್ಕಿಸಿ",
    "nav.myAccount": "ನನ್ನ ಖಾತೆ",
    "nav.signOut": "ಸೈನ್ ಔಟ್",
    "nav.language": "ಭಾಷೆ",
    
    // Common
    "common.loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    "common.error": "ದೋಷ",
    "common.success": "ಯಶಸ್ಸು",
    "common.save": "ಉಳಿಸಿ",
    "common.cancel": "ರದ್ದುಮಾಡಿ",
    "common.delete": "ಅಳಿಸಿ",
    "common.edit": "ಸಂಪಾದಿಸಿ",
    "common.view": "ನೋಡಿ",
    "common.back": "ಹಿಂದೆ",
    "common.next": "ಮುಂದೆ",
    "common.submit": "ಸಲ್ಲಿಸಿ",
    "common.search": "ಹುಡುಕಿ",
    "common.filter": "ಫಿಲ್ಟರ್",
    "common.close": "ಮುಚ್ಚಿ",
    "common.yes": "ಹೌದು",
    "common.no": "ಇಲ್ಲ",
    
    // Homepage
    "home.title": "ಭಾರತದ #1 ಟ್ರಾಕ್ಟರ್ ಏಲಾಂ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್",
    "home.subtitle": "ಟ್ರಾಕ್ಟರ್‌ಗಳು, ಹಾರ್ವೆಸ್ಟರ್‌ಗಳು ಮತ್ತು ಸ್ಕ್ರ್ಯಾಪ್ ವಾಹನಗಳನ್ನು ಖರೀದಿಸಿ ಮತ್ತು ಮಾರಾಟ ಮಾಡಿ",
    "home.description": "ಭಾರತದಾದ್ಯಂತ 2000+ ಖರೀದಿದಾರರು ಮತ್ತು 500+ ಮಾರಾಟಗಾರರಿಂದ ನಂಬಲಾಗಿದೆ",
    "home.registerNow": "ಉಚಿತವಾಗಿ ಪ್ರಾರಂಭಿಸಿ - ಈಗ ನೋಂದಾಯಿಸಿ",
    "home.viewAuctions": "ಲೈವ್ ಏಲಾಂಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    "home.preApprovedVehicles": "ಮುಂಚಿತವಾಗಿ ಅನುಮೋದಿಸಲಾಗಿದೆ ವಾಹನಗಳು",
    "home.sellVehicle": "ನಿಮ್ಮ ವಾಹನವನ್ನು ಮಾರಾಟ ಮಾಡಿ",
    "home.callUs": "ಕರೆ ಮಾಡಿ: 7801094747",
    
    // Auctions
    "auctions.live": "ಲೈವ್ ಏಲಾಂಗಳು",
    "auctions.upcoming": "ಮುಂಬರುವ ಏಲಾಂಗಳು",
    "auctions.ended": "ಮುಗಿದ ಏಲಾಂಗಳು",
    "auctions.placeBid": "ಬಿಡ್ ಮಾಡಿ",
    "auctions.currentBid": "ಪ್ರಸ್ತುತ ಬಿಡ್",
    "auctions.minimumBid": "ಕನಿಷ್ಠ ಬಿಡ್",
    "auctions.reservePrice": "ರಕ್ಷಣಾ ಬೆಲೆ",
    "auctions.timeRemaining": "ಉಳಿದ ಸಮಯ",
    "auctions.biddingActive": "ಬಿಡ್ಡಿಂಗ್ ಸಕ್ರಿಯ",
    "auctions.totalBids": "ಒಟ್ಟು ಬಿಡ್‌ಗಳು",
    "auctions.winningBid": "ಗೆದ್ದ ಬಿಡ್",
    
    // My Account
    "account.welcome": "ಸ್ವಾಗತ",
    "account.personalDetails": "ವೈಯಕ್ತಿಕ ವಿವರಗಳು",
    "account.myVehicles": "ನನ್ನ ವಾಹನಗಳು",
    "account.myBids": "ನನ್ನ ಬಿಡ್‌ಗಳು",
    "account.myPurchases": "ನನ್ನ ಖರೀದಿಗಳು",
    "account.membership": "ಸದಸ್ಯತ್ವ",
    "account.kycVerification": "KYC ಪರಿಶೀಲನೆ",
    
    // Forms
    "form.fullName": "ಪೂರ್ಣ ಹೆಸರು",
    "form.phoneNumber": "ಫೋನ್ ಸಂಖ್ಯೆ",
    "form.email": "ಇಮೇಲ್",
    "form.address": "ವಿಳಾಸ",
    "form.city": "ನಗರ",
    "form.state": "ರಾಜ್ಯ",
    "form.district": "ಜಿಲ್ಲೆ",
    "form.pincode": "ಪಿನ್ ಕೋಡ್",
    "form.required": "ಈ ಫೀಲ್ಡ್ ಅಗತ್ಯವಿದೆ",
    
    // Buttons
    "btn.login": "ಲಾಗಿನ್",
    "btn.register": "ನೋಂದಾಯಿಸಿ",
    "btn.logout": "ಲಾಗ್ ಔಟ್",
    "btn.upload": "ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    "btn.download": "ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "btn.continue": "ಮುಂದುವರಿಸಿ",
    "btn.finish": "ಮುಗಿಸಿ",
  },
  
  mr: {
    // Navigation
    "nav.home": "मुखपृष्ठ",
    "nav.auctions": "लिलाव",
    "nav.preApproved": "पूर्व-मंजूर",
    "nav.contact": "संपर्क करा",
    "nav.myAccount": "माझे खाते",
    "nav.signOut": "साइन आउट",
    "nav.language": "भाषा",
    
    // Common
    "common.loading": "लोड होत आहे...",
    "common.error": "त्रुटी",
    "common.success": "यशस्वी",
    "common.save": "जतन करा",
    "common.cancel": "रद्द करा",
    "common.delete": "हटवा",
    "common.edit": "संपादन करा",
    "common.view": "पहा",
    "common.back": "मागे",
    "common.next": "पुढे",
    "common.submit": "सबमिट करा",
    "common.search": "शोधा",
    "common.filter": "फिल्टर",
    "common.close": "बंद करा",
    "common.yes": "होय",
    "common.no": "नाही",
    
    // Homepage
    "home.title": "भारताचे #1 ट्रॅक्टर लिलाव प्लॅटफॉर्म",
    "home.subtitle": "ट्रॅक्टर, हार्वेस्टर आणि स्क्रॅप वाहने खरेदी आणि विक्री करा",
    "home.description": "भारतभरात 2000+ खरेदीदार आणि 500+ विक्रेत्यांद्वारे विश्वासार्ह",
    "home.registerNow": "विनामूल्य सुरू करा - आता नोंदणी करा",
    "home.viewAuctions": "लाइव्ह लिलाव पहा",
    "home.preApprovedVehicles": "पूर्व-मंजूर वाहने",
    "home.sellVehicle": "आपले वाहन विका",
    "home.callUs": "कॉल करा: 7801094747",
    
    // Auctions
    "auctions.live": "लाइव्ह लिलाव",
    "auctions.upcoming": "आगामी लिलाव",
    "auctions.ended": "समाप्त लिलाव",
    "auctions.placeBid": "बोली लावा",
    "auctions.currentBid": "सध्याची बोली",
    "auctions.minimumBid": "किमान बोली",
    "auctions.reservePrice": "राखीव किंमत",
    "auctions.timeRemaining": "उरलेला वेळ",
    "auctions.biddingActive": "बोली सक्रिय",
    "auctions.totalBids": "एकूण बोली",
    "auctions.winningBid": "जिंकणारी बोली",
    
    // My Account
    "account.welcome": "स्वागत आहे",
    "account.personalDetails": "वैयक्तिक तपशील",
    "account.myVehicles": "माझी वाहने",
    "account.myBids": "माझ्या बोली",
    "account.myPurchases": "माझी खरेदी",
    "account.membership": "सदस्यत्व",
    "account.kycVerification": "KYC सत्यापन",
    
    // Forms
    "form.fullName": "पूर्ण नाव",
    "form.phoneNumber": "फोन नंबर",
    "form.email": "ईमेल",
    "form.address": "पत्ता",
    "form.city": "शहर",
    "form.state": "राज्य",
    "form.district": "जिल्हा",
    "form.pincode": "पिन कोड",
    "form.required": "हे फील्ड आवश्यक आहे",
    
    // Buttons
    "btn.login": "लॉगिन",
    "btn.register": "नोंदणी करा",
    "btn.logout": "लॉग आउट",
    "btn.upload": "अपलोड करा",
    "btn.download": "डाउनलोड करा",
    "btn.continue": "पुढे जा",
    "btn.finish": "समाप्त करा",
  },
  
  pa: {
    // Navigation
    "nav.home": "ਘਰ",
    "nav.auctions": "ਨਿਲਾਮੀ",
    "nav.preApproved": "ਪਹਿਲਾਂ ਤੋਂ ਮਨਜ਼ੂਰ",
    "nav.contact": "ਸੰਪਰਕ ਕਰੋ",
    "nav.myAccount": "ਮੇਰਾ ਖਾਤਾ",
    "nav.signOut": "ਸਾਈਨ ਆਉਟ",
    "nav.language": "ਭਾਸ਼ਾ",
    
    // Common
    "common.loading": "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
    "common.error": "ਗਲਤੀ",
    "common.success": "ਸਫਲ",
    "common.save": "ਸੁਰੱਖਿਅਤ ਕਰੋ",
    "common.cancel": "ਰੱਦ ਕਰੋ",
    "common.delete": "ਮਿਟਾਓ",
    "common.edit": "ਸੰਪਾਦਨ ਕਰੋ",
    "common.view": "ਦੇਖੋ",
    "common.back": "ਪਿੱਛੇ",
    "common.next": "ਅਗਲਾ",
    "common.submit": "ਜਮ੍ਹਾ ਕਰੋ",
    "common.search": "ਖੋਜੋ",
    "common.filter": "ਫਿਲਟਰ",
    "common.close": "ਬੰਦ ਕਰੋ",
    "common.yes": "ਹਾਂ",
    "common.no": "ਨਹੀਂ",
    
    // Homepage
    "home.title": "ਭਾਰਤ ਦਾ #1 ਟ੍ਰੈਕਟਰ ਨਿਲਾਮੀ ਪਲੇਟਫਾਰਮ",
    "home.subtitle": "ਟ੍ਰੈਕਟਰ, ਹਾਰਵੈਸਟਰ ਅਤੇ ਸਕ੍ਰੈਪ ਵਾਹਨ ਖਰੀਦੋ ਅਤੇ ਵੇਚੋ",
    "home.description": "ਭਾਰਤ ਭਰ ਵਿੱਚ 2000+ ਖਰੀਦਦਾਰਾਂ ਅਤੇ 500+ ਵਿਕਰੇਤਾਵਾਂ ਦੁਆਰਾ ਭਰੋਸੇਮੰਦ",
    "home.registerNow": "ਮੁਫ਼ਤ ਸ਼ੁਰੂ ਕਰੋ - ਹੁਣੇ ਰਜਿਸਟਰ ਕਰੋ",
    "home.viewAuctions": "ਲਾਈਵ ਨਿਲਾਮੀਆਂ ਦੇਖੋ",
    "home.preApprovedVehicles": "ਪਹਿਲਾਂ ਤੋਂ ਮਨਜ਼ੂਰ ਵਾਹਨ",
    "home.sellVehicle": "ਆਪਣਾ ਵਾਹਨ ਵੇਚੋ",
    "home.callUs": "ਕਾਲ ਕਰੋ: 7801094747",
    
    // Auctions
    "auctions.live": "ਲਾਈਵ ਨਿਲਾਮੀਆਂ",
    "auctions.upcoming": "ਆਉਣ ਵਾਲੀਆਂ ਨਿਲਾਮੀਆਂ",
    "auctions.ended": "ਸਮਾਪਤ ਨਿਲਾਮੀਆਂ",
    "auctions.placeBid": "ਬੋਲੀ ਲਗਾਓ",
    "auctions.currentBid": "ਮੌਜੂਦਾ ਬੋਲੀ",
    "auctions.minimumBid": "ਘੱਟੋ-ਘੱਟ ਬੋਲੀ",
    "auctions.reservePrice": "ਰਿਜ਼ਰਵ ਕੀਮਤ",
    "auctions.timeRemaining": "ਬਾਕੀ ਸਮਾਂ",
    "auctions.biddingActive": "ਬੋਲੀ ਸਰਗਰਮ",
    "auctions.totalBids": "ਕੁੱਲ ਬੋਲੀਆਂ",
    "auctions.winningBid": "ਜਿੱਤਣ ਵਾਲੀ ਬੋਲੀ",
    
    // My Account
    "account.welcome": "ਜੀ ਆਇਆਂ ਨੂੰ",
    "account.personalDetails": "ਨਿੱਜੀ ਵੇਰਵੇ",
    "account.myVehicles": "ਮੇਰੇ ਵਾਹਨ",
    "account.myBids": "ਮੇਰੀਆਂ ਬੋਲੀਆਂ",
    "account.myPurchases": "ਮੇਰੀਆਂ ਖਰੀਦਾਂ",
    "account.membership": "ਮੈਂਬਰਸ਼ਿਪ",
    "account.kycVerification": "KYC ਪੜਤਾਲ",
    
    // Forms
    "form.fullName": "ਪੂਰਾ ਨਾਮ",
    "form.phoneNumber": "ਫੋਨ ਨੰਬਰ",
    "form.email": "ਈਮੇਲ",
    "form.address": "ਪਤਾ",
    "form.city": "ਸ਼ਹਿਰ",
    "form.state": "ਰਾਜ",
    "form.district": "ਜ਼ਿਲ੍ਹਾ",
    "form.pincode": "ਪਿੰਨ ਕੋਡ",
    "form.required": "ਇਹ ਖੇਤਰ ਜ਼ਰੂਰੀ ਹੈ",
    
    // Buttons
    "btn.login": "ਲਾਗਇਨ",
    "btn.register": "ਰਜਿਸਟਰ ਕਰੋ",
    "btn.logout": "ਲਾਗਆਉਟ",
    "btn.upload": "ਅਪਲੋਡ ਕਰੋ",
    "btn.download": "ਡਾਊਨਲੋਡ ਕਰੋ",
    "btn.continue": "ਜਾਰੀ ਰੱਖੋ",
    "btn.finish": "ਸਮਾਪਤ ਕਰੋ",
  },
  
  gu: {
    // Navigation
    "nav.home": "હોમ",
    "nav.auctions": "નિલામી",
    "nav.preApproved": "પહેલાથી મંજૂર",
    "nav.contact": "સંપર્ક કરો",
    "nav.myAccount": "મારું એકાઉન્ટ",
    "nav.signOut": "સાઇન આઉટ",
    "nav.language": "ભાષા",
    
    // Common
    "common.loading": "લોડ થઈ રહ્યું છે...",
    "common.error": "ભૂલ",
    "common.success": "સફળતા",
    "common.save": "સેવ કરો",
    "common.cancel": "રદ કરો",
    "common.delete": "કાઢી નાખો",
    "common.edit": "સંપાદન કરો",
    "common.view": "જુઓ",
    "common.back": "પાછળ",
    "common.next": "આગળ",
    "common.submit": "સબમિટ કરો",
    "common.search": "શોધો",
    "common.filter": "ફિલ્ટર",
    "common.close": "બંધ કરો",
    "common.yes": "હા",
    "common.no": "ના",
    
    // Homepage
    "home.title": "ભારતનું #1 ટ્રેક્ટર નિલામી પ્લેટફોર્મ",
    "home.subtitle": "ટ્રેક્ટર, હાર્વેસ્ટર અને સ્ક્રેપ વાહનો ખરીદો અને વેચો",
    "home.description": "ભારતભરમાં 2000+ ખરીદદારો અને 500+ વિક્રેતાઓ દ્વારા વિશ્વસનીય",
    "home.registerNow": "મફત શરૂ કરો - હમણાં નોંધણી કરો",
    "home.viewAuctions": "લાઇવ નિલામીઓ જુઓ",
    "home.preApprovedVehicles": "પહેલાથી મંજૂર વાહનો",
    "home.sellVehicle": "તમારું વાહન વેચો",
    "home.callUs": "કૉલ કરો: 7801094747",
    
    // Auctions
    "auctions.live": "લાઇવ નિલામીઓ",
    "auctions.upcoming": "આગામી નિલામીઓ",
    "auctions.ended": "સમાપ્ત નિલામીઓ",
    "auctions.placeBid": "બિડ મૂકો",
    "auctions.currentBid": "વર્તમાન બિડ",
    "auctions.minimumBid": "ન્યૂનતમ બિડ",
    "auctions.reservePrice": "રિઝર્વ કિંમત",
    "auctions.timeRemaining": "બાકી સમય",
    "auctions.biddingActive": "બિડિંગ સક્રિય",
    "auctions.totalBids": "કુલ બિડ્સ",
    "auctions.winningBid": "જીતનારી બિડ",
    
    // My Account
    "account.welcome": "સ્વાગત છે",
    "account.personalDetails": "વ્યક્તિગત વિગતો",
    "account.myVehicles": "મારા વાહનો",
    "account.myBids": "મારી બિડ્સ",
    "account.myPurchases": "મારી ખરીદી",
    "account.membership": "સભ્યપદ",
    "account.kycVerification": "KYC ચકાસણી",
    
    // Forms
    "form.fullName": "પૂર્ણ નામ",
    "form.phoneNumber": "ફોન નંબર",
    "form.email": "ઇમેઇલ",
    "form.address": "સરનામું",
    "form.city": "શહેર",
    "form.state": "રાજ્ય",
    "form.district": "જિલ્લો",
    "form.pincode": "પિન કોડ",
    "form.required": "આ ફીલ્ડ જરૂરી છે",
    
    // Buttons
    "btn.login": "લૉગિન",
    "btn.register": "નોંધણી કરો",
    "btn.logout": "લૉગ આઉટ",
    "btn.upload": "અપલોડ કરો",
    "btn.download": "ડાઉનલોડ કરો",
    "btn.continue": "ચાલુ રાખો",
    "btn.finish": "સમાપ્ત કરો",
  },
  
  or: {
    // Navigation
    "nav.home": "ଘର",
    "nav.auctions": "ନିଲାମ",
    "nav.preApproved": "ପୂର୍ବ-ଅନୁମୋଦିତ",
    "nav.contact": "ଯୋଗାଯୋଗ କରନ୍ତୁ",
    "nav.myAccount": "ମୋର ଖାତା",
    "nav.signOut": "ସାଇନ୍ ଆଉଟ୍",
    "nav.language": "ଭାଷା",
    
    // Common
    "common.loading": "ଲୋଡ୍ ହେଉଛି...",
    "common.error": "ତ୍ରୁଟି",
    "common.success": "ସଫଳତା",
    "common.save": "ସଞ୍ଚୟ କରନ୍ତୁ",
    "common.cancel": "ବାତିଲ୍ କରନ୍ତୁ",
    "common.delete": "ଡିଲିଟ୍ କରନ୍ତୁ",
    "common.edit": "ସଂପାଦନ କରନ୍ତୁ",
    "common.view": "ଦେଖନ୍ତୁ",
    "common.back": "ପଛକୁ",
    "common.next": "ପରବର୍ତ୍ତୀ",
    "common.submit": "ଦାଖଲ କରନ୍ତୁ",
    "common.search": "ଖୋଜନ୍ତୁ",
    "common.filter": "ଫିଲ୍ଟର୍",
    "common.close": "ବନ୍ଦ କରନ୍ତୁ",
    "common.yes": "ହଁ",
    "common.no": "ନା",
    
    // Homepage
    "home.title": "ଭାରତର #1 ଟ୍ରାକ୍ଟର୍ ନିଲାମ ପ୍ଲାଟଫର୍ମ",
    "home.subtitle": "ଟ୍ରାକ୍ଟର୍, ହାର୍ଭେଷ୍ଟର୍ ଏବଂ ସ୍କ୍ରାପ୍ ଯାନ କିଣନ୍ତୁ ଏବଂ ବିକ୍ରୟ କରନ୍ତୁ",
    "home.description": "ଭାରତରେ 2000+ କ୍ରେତା ଏବଂ 500+ ବିକ୍ରେତାଙ୍କ ଦ୍ୱାରା ବିଶ୍ୱସନୀୟ",
    "home.registerNow": "ମାଗଣା ଆରମ୍ଭ କରନ୍ତୁ - ବର୍ତ୍ତମାନ ରଜିଷ୍ଟର୍ କରନ୍ତୁ",
    "home.viewAuctions": "ଲାଇଭ୍ ନିଲାମ ଦେଖନ୍ତୁ",
    "home.preApprovedVehicles": "ପୂର୍ବ-ଅନୁମୋଦିତ ଯାନ",
    "home.sellVehicle": "ଆପଣଙ୍କର ଯାନ ବିକ୍ରୟ କରନ୍ତୁ",
    "home.callUs": "କଲ୍ କରନ୍ତୁ: 7801094747",
    
    // Auctions
    "auctions.live": "ଲାଇଭ୍ ନିଲାମ",
    "auctions.upcoming": "ଆସନ୍ତା ନିଲାମ",
    "auctions.ended": "ଶେଷ ନିଲାମ",
    "auctions.placeBid": "ବିଡ୍ ଦିଅନ୍ତୁ",
    "auctions.currentBid": "ବର୍ତ୍ତମାନର ବିଡ୍",
    "auctions.minimumBid": "ସର୍ବନିମ୍ନ ବିଡ୍",
    "auctions.reservePrice": "ରିଜର୍ଭ ମୂଲ୍ୟ",
    "auctions.timeRemaining": "ବାକି ସମୟ",
    "auctions.biddingActive": "ବିଡିଂ ସକ୍ରିୟ",
    "auctions.totalBids": "ମୋଟ ବିଡ୍",
    "auctions.winningBid": "ଜିତିବା ବିଡ୍",
    
    // My Account
    "account.welcome": "ସ୍ୱାଗତ",
    "account.personalDetails": "ବ୍ୟକ୍ତିଗତ ବିବରଣୀ",
    "account.myVehicles": "ମୋର ଯାନ",
    "account.myBids": "ମୋର ବିଡ୍",
    "account.myPurchases": "ମୋର କ୍ରୟ",
    "account.membership": "ସଦସ୍ୟତା",
    "account.kycVerification": "KYC ଯାଞ୍ଚ",
    
    // Forms
    "form.fullName": "ପୂର୍ଣ୍ଣ ନାମ",
    "form.phoneNumber": "ଫୋନ୍ ନମ୍ବର",
    "form.email": "ଇମେଲ୍",
    "form.address": "ଠିକଣା",
    "form.city": "ସହର",
    "form.state": "ରାଜ୍ୟ",
    "form.district": "ଜିଲ୍ଲା",
    "form.pincode": "ପିନ୍ କୋଡ୍",
    "form.required": "ଏହି କ୍ଷେତ୍ର ଆବଶ୍ୟକ",
    
    // Buttons
    "btn.login": "ଲଗଇନ୍",
    "btn.register": "ରଜିଷ୍ଟର୍ କରନ୍ତୁ",
    "btn.logout": "ଲଗ୍ ଆଉଟ୍",
    "btn.upload": "ଅପଲୋଡ୍ କରନ୍ତୁ",
    "btn.download": "ଡାଉନଲୋଡ୍ କରନ୍ତୁ",
    "btn.continue": "ଜାରି ରଖନ୍ତୁ",
    "btn.finish": "ଶେଷ କରନ୍ତୁ",
  },
  
  bn: {
    // Navigation
    "nav.home": "হোম",
    "nav.auctions": "নিলাম",
    "nav.preApproved": "পূর্ব-অনুমোদিত",
    "nav.contact": "যোগাযোগ",
    "nav.myAccount": "আমার অ্যাকাউন্ট",
    "nav.signOut": "সাইন আউট",
    "nav.language": "ভাষা",
    
    // Common
    "common.loading": "লোড হচ্ছে...",
    "common.error": "ত্রুটি",
    "common.success": "সফল",
    "common.save": "সংরক্ষণ করুন",
    "common.cancel": "বাতিল করুন",
    "common.delete": "মুছুন",
    "common.edit": "সম্পাদনা করুন",
    "common.view": "দেখুন",
    "common.back": "পিছনে",
    "common.next": "পরবর্তী",
    "common.submit": "জমা দিন",
    "common.search": "খুঁজুন",
    "common.filter": "ফিল্টার",
    "common.close": "বন্ধ করুন",
    "common.yes": "হ্যাঁ",
    "common.no": "না",
    
    // Homepage
    "home.title": "ভারতের #1 ট্র্যাক্টর নিলাম প্ল্যাটফর্ম",
    "home.subtitle": "ট্র্যাক্টর, হার্ভেস্টার এবং স্ক্র্যাপ যানবাহন কিনুন এবং বিক্রি করুন",
    "home.description": "ভারত জুড়ে 2000+ ক্রেতা এবং 500+ বিক্রেতাদের দ্বারা বিশ্বস্ত",
    "home.registerNow": "বিনামূল্যে শুরু করুন - এখনই নিবন্ধন করুন",
    "home.viewAuctions": "লাইভ নিলাম দেখুন",
    "home.preApprovedVehicles": "পূর্ব-অনুমোদিত যানবাহন",
    "home.sellVehicle": "আপনার যানবাহন বিক্রি করুন",
    "home.callUs": "কল করুন: 7801094747",
    
    // Auctions
    "auctions.live": "লাইভ নিলাম",
    "auctions.upcoming": "আসন্ন নিলাম",
    "auctions.ended": "শেষ নিলাম",
    "auctions.placeBid": "বিড করুন",
    "auctions.currentBid": "বর্তমান বিড",
    "auctions.minimumBid": "সর্বনিম্ন বিড",
    "auctions.reservePrice": "রিজার্ভ মূল্য",
    "auctions.timeRemaining": "অবশিষ্ট সময়",
    "auctions.biddingActive": "বিডিং সক্রিয়",
    "auctions.totalBids": "মোট বিড",
    "auctions.winningBid": "জয়ী বিড",
    
    // My Account
    "account.welcome": "স্বাগতম",
    "account.personalDetails": "ব্যক্তিগত বিবরণ",
    "account.myVehicles": "আমার যানবাহন",
    "account.myBids": "আমার বিড",
    "account.myPurchases": "আমার ক্রয়",
    "account.membership": "সদস্যতা",
    "account.kycVerification": "KYC যাচাইকরণ",
    
    // Forms
    "form.fullName": "পূর্ণ নাম",
    "form.phoneNumber": "ফোন নম্বর",
    "form.email": "ইমেইল",
    "form.address": "ঠিকানা",
    "form.city": "শহর",
    "form.state": "রাজ্য",
    "form.district": "জেলা",
    "form.pincode": "পিন কোড",
    "form.required": "এই ক্ষেত্রটি প্রয়োজনীয়",
    
    // Buttons
    "btn.login": "লগইন",
    "btn.register": "নিবন্ধন করুন",
    "btn.logout": "লগআউট",
    "btn.upload": "আপলোড করুন",
    "btn.download": "ডাউনলোড করুন",
    "btn.continue": "চালিয়ে যান",
    "btn.finish": "শেষ করুন",
  },
};

// Helper function to get translation
export function t(key: string, lang: Language = "en"): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

// Get language from localStorage or browser
export function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("language") as Language;
  if (saved && languages.some((l) => l.code === saved)) {
    return saved;
  }
  // Try to detect from browser
  const browserLang = navigator.language.split("-")[0];
  const matched = languages.find((l) => l.code === browserLang);
  return matched ? matched.code : "en";
}

// Set language preference
export function setLanguage(lang: Language) {
  if (typeof window !== "undefined") {
    localStorage.setItem("language", lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  }
}



