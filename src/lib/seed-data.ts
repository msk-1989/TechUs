// Seed data for Hidayah Connect & TeachUs Testing Reporting System
// Organized by Module → Suite → Test Case

export interface SeedTestCase {
  title: string;
  description?: string;
  steps?: string;
  expected?: string;
  priority?: "low" | "medium" | "high" | "critical";
  category?: "functional" | "ui" | "integration" | "security" | "payment";
}

export interface SeedSuite {
  name: string;
  description?: string;
  testCases: SeedTestCase[];
}

export interface SeedModule {
  key: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  suites: SeedSuite[];
}

export const SEED_MODULES: SeedModule[] = [
  {
    key: "landing",
    name: "Landing Page",
    description: "Public-facing landing page with course discovery, search, and CTAs (no login required).",
    icon: "Globe",
    order: 1,
    suites: [
      {
        name: "Hero & Navigation",
        description: "Top-level marketing elements and primary navigation.",
        testCases: [
          { title: "Hero banner displays with CTA buttons", description: "Hero section shows headline, subheadline, and primary CTA buttons", expected: "Hero section renders with both 'Become a Teacher' and 'Browse Courses' CTAs visible above the fold", priority: "high", category: "ui" },
          { title: "Features section renders", description: "Platform features section displays all feature cards", expected: "All feature cards render with icons, titles, and descriptions", priority: "medium", category: "ui" },
          { title: "Earnings Potential section displays", description: "Earnings calculator/potential section is visible and functional", expected: "Earnings section shows expected earning ranges and is interactive", priority: "medium", category: "functional" },
          { title: "About Us page loads", description: "About Us link in main menu opens platform overview page", expected: "About Us page renders with Hidayah Connect & TeachUs overview content", priority: "low", category: "functional" },
          { title: "FAQ page renders with both teacher and student FAQs", description: "FAQ link opens Frequently Asked Questions page", expected: "FAQ page shows both teacher and student FAQ sections, organized by audience", priority: "medium", category: "functional" },
          { title: "Support link opens Help Center", description: "Support menu item links to Help Center", expected: "Clicking Support navigates to Help Center page (24/7 access messaging visible)", priority: "low", category: "functional" },
          { title: "Become a Teacher CTA opens registration wizard", description: "Clicking 'Become a Teacher' starts the 7-step teacher registration flow", expected: "7-step registration wizard opens at Step A (Account Creation)", priority: "high", category: "functional" },
          { title: "Login page accepts email or mobile + password", description: "Login link opens login form for returning users", expected: "Login form accepts email OR mobile number plus password; successful auth redirects to dashboard", priority: "high", category: "functional" },
        ],
      },
      {
        name: "Course Search & Filters",
        description: "Browse Courses with mandatory gender filter and supporting filters.",
        testCases: [
          { title: "Search bar returns real-time results by keyword", description: "Typing a keyword searches across course titles and descriptions", expected: "Course results update in real-time as keyword is typed", priority: "high", category: "functional" },
          { title: "Gender filter is mandatory", description: "Students must select teacher gender before any search results are returned", expected: "Search is blocked or returns no results until gender filter is selected; visible prompt indicates requirement", priority: "critical", category: "functional" },
          { title: "Subject filter narrows results", description: "Subject filter dropdown applies to course list", expected: "Course list updates to only show courses matching selected subject", priority: "medium", category: "functional" },
          { title: "Country filter narrows results", description: "Country filter dropdown applies to course list", expected: "Course list filters by teacher's country", priority: "medium", category: "functional" },
          { title: "Language filter narrows results", description: "Language filter dropdown applies to course list", expected: "Course list filters by teaching language", priority: "medium", category: "functional" },
          { title: "Price Range filter narrows results", description: "Price range slider applies to course list", expected: "Course list filters to only those within selected price range", priority: "medium", category: "functional" },
          { title: "Rating filter narrows results", description: "Rating filter (e.g., 4+ stars) applies to course list", expected: "Course list filters to only those meeting minimum rating", priority: "medium", category: "functional" },
          { title: "Course cards display thumbnail, title, teacher name, rating, 'Starting from' price", description: "Each course card shows all required metadata", expected: "Every course card shows: thumbnail image, course title, teacher name, star rating, and 'Starting from' price label", priority: "high", category: "ui" },
          { title: "Clicking a course card opens full course details", description: "Card click navigates to detail page", expected: "Full course detail page loads with description, modules, schedule, pricing, and teacher info", priority: "high", category: "functional" },
        ],
      },
    ],
  },
  {
    key: "teacher_reg",
    name: "Teacher Registration Wizard",
    description: "7-step registration flow: Account, Fee, Profile, KYC, Qualifications, Payout, Review.",
    icon: "UserPlus",
    order: 2,
    suites: [
      {
        name: "Step A - Account Creation",
        description: "Platform selection, identity capture, OTP verification.",
        testCases: [
          { title: "Platform dropdown shows HidayahConnect / TeachUsConnect", description: "Platform selector determines fee and commission", expected: "Dropdown displays both platforms; selecting one updates fee currency and commission rules", priority: "high", category: "functional" },
          { title: "Full Name field is required", description: "Form cannot be submitted without full name", expected: "Validation error appears if Full Name is empty", priority: "medium", category: "functional" },
          { title: "Email + OTP verification works (unique email)", description: "Email field requires OTP, must be unique in system", expected: "OTP sent to email; verified OTP moves to next step; duplicate emails rejected", priority: "high", category: "functional" },
          { title: "Mobile Number + OTP verification works (unique mobile)", description: "Mobile field requires OTP, must be unique", expected: "OTP sent to mobile; verified OTP moves to next step; duplicate numbers rejected", priority: "high", category: "functional" },
          { title: "Country dropdown determines fee currency & payment gateway", description: "Country selection affects downstream currency and gateway", expected: "India → INR + Razorpay; International → USD + Stripe", priority: "high", category: "functional" },
          { title: "Gender radio selection works (Male/Female/Other)", description: "Gender radio button group functions", expected: "User can select exactly one gender option", priority: "medium", category: "functional" },
          { title: "Submit sends OTPs to both email and mobile", description: "Form submission triggers dual OTP", expected: "Both email and mobile receive OTPs simultaneously", priority: "high", category: "integration" },
          { title: "Both OTPs must be verified before next step", description: "Cannot proceed without verifying both OTPs", expected: "Next button disabled until both OTPs verified; status becomes 'Account Created'", priority: "high", category: "functional" },
        ],
      },
      {
        name: "Step B - Registration Fee Payment",
        description: "One-time fee, coupon, GST, gateway integration.",
        testCases: [
          { title: "Registration fee displays ₹399 for India", description: "Indian teachers see INR pricing", expected: "Fee shows ₹399 with GST line item", priority: "high", category: "payment" },
          { title: "Registration fee displays $9.99 for International", description: "International teachers see USD pricing", expected: "Fee shows $9.99 with no GST", priority: "high", category: "payment" },
          { title: "Coupon code applies valid discount", description: "Valid coupon reduces fee", expected: "Discount applied and total recalculated", priority: "medium", category: "payment" },
          { title: "Invalid coupon rejected with message", description: "Invalid coupon shows error", expected: "Error toast/banner indicates invalid coupon", priority: "medium", category: "payment" },
          { title: "GST auto-calculated for India only", description: "GST line item appears only for Indian teachers", expected: "GST (18%) shown for India; not shown for International", priority: "high", category: "payment" },
          { title: "Razorpay payment completes for India", description: "Razorpay gateway handles Indian payments", expected: "Payment success redirects to invoice; status becomes 'Registration Completed'", priority: "critical", category: "payment" },
          { title: "Stripe payment completes for International", description: "Stripe handles international payments", expected: "Payment success redirects to invoice; status becomes 'Registration Completed'", priority: "critical", category: "payment" },
          { title: "Payment failure shows error and allows retry", description: "Failed payment doesn't change status", expected: "Error displayed; user can retry; status remains 'Account Created'", priority: "high", category: "payment" },
          { title: "Invoice generated on successful payment", description: "System generates invoice after payment", expected: "Downloadable invoice available in teacher dashboard", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Step C - Profile Setup",
        description: "Personal and professional details, 20+ fields.",
        testCases: [
          { title: "Profile Photo upload is required", description: "Cannot complete profile without photo", expected: "Validation blocks submission; image preview shown after upload", priority: "high", category: "functional" },
          { title: "About Me long text saves with formatting", description: "Biography text field accepts long content", expected: "Multi-paragraph text saved correctly", priority: "low", category: "functional" },
          { title: "Date of Birth picker works", description: "DOB is required and uses date picker", expected: "Calendar date picker returns valid date", priority: "medium", category: "ui" },
          { title: "Nationality dropdown works", description: "Country selection for nationality", expected: "Dropdown shows all countries; selection saved", priority: "low", category: "functional" },
          { title: "State/City fields work", description: "Location details captured", expected: "State dropdown updates based on country; city is text input", priority: "low", category: "functional" },
          { title: "WhatsApp Number is optional", description: "Optional WhatsApp field", expected: "Form submits without WhatsApp number; saves when provided", priority: "low", category: "functional" },
          { title: "Languages Known multi-select works", description: "Multiple languages selectable", expected: "All selected languages saved as array", priority: "medium", category: "functional" },
          { title: "Preferred Teaching Language dropdown works", description: "Primary teaching language", expected: "Single language selected and saved", priority: "medium", category: "functional" },
          { title: "Time Zone auto-detected and editable", description: "Time zone auto-populated, user can change", expected: "Auto-detects user's TZ; dropdown allows override", priority: "high", category: "functional" },
          { title: "Highest Qualification dropdown works", description: "Academic qualification selection", expected: "Dropdown options save correctly", priority: "low", category: "functional" },
          { title: "Islamic Qualification dropdown (Hidayah only)", description: "Quran/Tajweed/Hifz certifications", expected: "Field appears only for Hidayah platform; saves selected certifications", priority: "medium", category: "functional" },
          { title: "University/Institute text field", description: "Optional institution name", expected: "Text saves when provided", priority: "low", category: "functional" },
          { title: "Years of Experience numeric input", description: "Teaching experience in years", expected: "Numeric input with validation (non-negative)", priority: "low", category: "functional" },
          { title: "Teaching Categories & Subjects multi-select", description: "Platform-specific category list", expected: "Multiple selections saved; options depend on platform", priority: "high", category: "functional" },
          { title: "Curriculum(s) Taught multi-select (TeachUs)", description: "CBSE/ICSE/State Board/GCSE/IB", expected: "Field appears only for TeachUs; multiple selections saved", priority: "medium", category: "functional" },
          { title: "Preferred Age Group multi-select", description: "Age ranges for students", expected: "Multiple age ranges saved", priority: "medium", category: "functional" },
          { title: "Preferred Student Gender radio (mandatory)", description: "Male/Female/Both - mandatory filter", expected: "Cannot submit without selecting gender preference", priority: "high", category: "functional" },
          { title: "Teaching Mode radio (One-to-One/Group/Both)", description: "Teaching mode selection", expected: "Radio button group functions; single selection", priority: "medium", category: "functional" },
          { title: "Profile Fee Type dropdown (Hourly/Monthly/Per Course)", description: "Fee structure selection", expected: "Selection saved; affects 'Starting from' display", priority: "high", category: "functional" },
          { title: "Profile Fee Amount numeric input", description: "Number input for fee", expected: "Numeric input; saved as 'Starting from' price on profile", priority: "high", category: "functional" },
          { title: "Status becomes 'Profile Completed' on save", description: "Status updates after profile save", expected: "Status field updates; wizard advances to Step D", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Step D - Identity Verification (KYC)",
        description: "ID upload, live selfie, face matching.",
        testCases: [
          { title: "ID Type dropdown shows Aadhaar/Passport/National ID/Driving License", description: "ID type selection", expected: "Dropdown shows all four ID types", priority: "medium", category: "functional" },
          { title: "ID Upload - Front (image/PDF) works", description: "Upload front side of ID", expected: "File uploads successfully; preview shown; file type validated", priority: "high", category: "functional" },
          { title: "ID Upload - Back (image/PDF) works when applicable", description: "Upload back side of ID", expected: "Field appears for ID types requiring back; upload works", priority: "medium", category: "functional" },
          { title: "Live Selfie via in-app camera", description: "Capture live selfie using device camera", expected: "Camera permission requested; photo captured and stored", priority: "high", category: "functional" },
          { title: "Face matching against ID photo works", description: "Automated face matching", expected: "System compares selfie to ID photo; match score returned", priority: "critical", category: "integration" },
          { title: "Final OTP confirmation works", description: "OTP-based final confirmation step", expected: "OTP sent and verified; status becomes 'Identity Verified'", priority: "high", category: "functional" },
          { title: "Mismatched face triggers review flag", description: "If face match fails", expected: "Status flagged for manual review; teacher notified", priority: "high", category: "security" },
        ],
      },
      {
        name: "Step E - Qualification Documents (Optional)",
        description: "Optional document uploads determining badge level.",
        testCases: [
          { title: "Degree Certificate upload works", description: "Optional degree upload", expected: "PDF/image upload with size validation", priority: "low", category: "functional" },
          { title: "Ijazah Certificate upload (Hidayah only)", description: "Ijazah upload for Hidayah teachers", expected: "Field appears only for Hidayah platform", priority: "medium", category: "functional" },
          { title: "Hafiz Certificate upload (Hidayah only)", description: "Hafiz upload for Hidayah teachers", expected: "Field appears only for Hidayah platform", priority: "medium", category: "functional" },
          { title: "Teaching License upload", description: "Optional teaching license", expected: "Upload works; file saved", priority: "low", category: "functional" },
          { title: "Professional Certifications multiple upload", description: "Multiple certifications", expected: "Multiple files can be added; each shown in list with remove option", priority: "low", category: "functional" },
          { title: "Resume upload", description: "Optional resume upload", expected: "PDF/DOC upload works", priority: "low", category: "functional" },
          { title: "Experience Letter upload", description: "Optional experience letter", expected: "File upload works", priority: "low", category: "functional" },
          { title: "Police Verification upload", description: "Optional police verification", expected: "File upload works", priority: "low", category: "functional" },
          { title: "Video Introduction upload 60-120 sec", description: "Video intro with duration validation", expected: "Video duration validated 60-120 sec; rejected if outside range", priority: "medium", category: "functional" },
          { title: "Skipping Step E keeps Level 1 badge", description: "Skip → Level 1 Teacher", expected: "Teacher receives Level 1 badge; can proceed to Step F", priority: "medium", category: "functional" },
          { title: "Uploading leads to Level 2 (Certified Teacher) after approval", description: "Upload → admin review → Level 2", expected: "Status changes to 'Pending Approval'; admin approves → Level 2 badge", priority: "high", category: "functional" },
        ],
      },
      {
        name: "Step F - Payout Setup",
        description: "Bank details for India (Razorpay) or International (Stripe Connect).",
        testCases: [
          { title: "India - Account Holder Name field", description: "Bank account holder name", expected: "Text input; saved with payout details", priority: "high", category: "payment" },
          { title: "India - Bank Account Number field", description: "Account number", expected: "Numeric input with validation", priority: "high", category: "payment" },
          { title: "India - IFSC Code field", description: "IFSC code with format validation", expected: "Input validated against IFSC pattern", priority: "high", category: "payment" },
          { title: "India - PAN Number field", description: "PAN with format validation", expected: "Input validated against PAN pattern (ABCDE1234F)", priority: "high", category: "payment" },
          { title: "International - Legal Name field", description: "Legal full name", expected: "Text input saved", priority: "high", category: "payment" },
          { title: "International - Date of Birth field", description: "DOB for identity verification", expected: "Date picker; must be 18+", priority: "high", category: "payment" },
          { title: "International - Address field", description: "Full address", expected: "Multi-line text input saved", priority: "medium", category: "payment" },
          { title: "International - Country dropdown", description: "Country of residence", expected: "Country dropdown with all options", priority: "medium", category: "payment" },
          { title: "International - Bank Account field", description: "International bank details", expected: "Bank account/IBAN input saved", priority: "high", category: "payment" },
          { title: "Stripe verifies identity and banking details", description: "Stripe Connect identity verification", expected: "Stripe verification completes; status becomes 'Payout Ready'", priority: "critical", category: "integration" },
        ],
      },
      {
        name: "Step G - Review & Submit",
        description: "Read-only summary with edit links.",
        testCases: [
          { title: "All data from Steps A-F shown read-only", description: "Summary view of all entered data", expected: "Every field from previous steps displayed; cannot be edited directly", priority: "high", category: "ui" },
          { title: "Edit links navigate back to each step", description: "Each section has edit button", expected: "Clicking edit returns to that step with data pre-filled", priority: "medium", category: "functional" },
          { title: "Submit changes status to 'Pending Verification'", description: "Final submission", expected: "Status becomes 'Pending Verification'; teacher dashboard accessible", priority: "high", category: "functional" },
          { title: "Admin notified on submission", description: "Admin receives notification", expected: "Admin dashboard shows new teacher in pending queue", priority: "high", category: "integration" },
        ],
      },
    ],
  },
  {
    key: "teacher_dashboard",
    name: "Teacher Dashboard",
    description: "Post-login dashboard with wallet, courses, students, messages, analytics, settings.",
    icon: "LayoutDashboard",
    order: 3,
    suites: [
      {
        name: "Dashboard Home & Profile",
        description: "Overview screen and profile completion.",
        testCases: [
          { title: "Dashboard home screen displays overview", description: "Home screen shows activity overview", expected: "Widgets for upcoming classes, recent messages, wallet summary visible", priority: "high", category: "ui" },
          { title: "Profile Completion % progress indicator", description: "Progress indicator reflects profile completeness", expected: "Percentage calculated from filled fields; updates as fields completed", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Wallet & Payouts",
        description: "Multi-balance wallet with withdrawal workflow.",
        testCases: [
          { title: "Available Balance shows amount ready to withdraw", description: "Available balance reflects completed-course earnings", expected: "Amount updates after course completion", priority: "high", category: "functional" },
          { title: "Pending Balance shows escrow amounts", description: "Pending balance in escrow awaiting release", expected: "Amount shown for in-progress milestone-based courses", priority: "high", category: "functional" },
          { title: "Locked Balance shows disputed amounts", description: "Locked balance during dispute/refund window", expected: "Amount held until resolution", priority: "high", category: "functional" },
          { title: "Withdrawn Balance shows total withdrawn", description: "Historical withdrawn total", expected: "Cumulative amount updates after each payout", priority: "medium", category: "functional" },
          { title: "Withdrawal History lists all transactions", description: "History with date/amount/status", expected: "Table shows date, amount, status (pending/approved/rejected)", priority: "medium", category: "functional" },
          { title: "Payout Request requires minimum ₹500", description: "Withdrawal minimum threshold", expected: "Requests below ₹500 rejected with message", priority: "high", category: "payment" },
          { title: "Payout Request requires admin approval", description: "Withdrawal workflow", expected: "Request created with 'pending' status; admin approves → amount deducted from available", priority: "high", category: "payment" },
        ],
      },
      {
        name: "Classes & Students",
        description: "Upcoming classes, student roster, attendance tracking.",
        testCases: [
          { title: "Upcoming Classes calendar view shows scheduled classes", description: "Calendar with date/time/student name/course", expected: "All scheduled classes visible with relevant metadata", priority: "high", category: "functional" },
          { title: "Join Class button launches live class", description: "Button active only within scheduled window", expected: "Button disabled outside window; enabled 5-10 min before start", priority: "critical", category: "functional" },
          { title: "Students list shows name, course, enrollment date", description: "Student roster", expected: "All enrolled students displayed with metadata", priority: "high", category: "functional" },
          { title: "Attendance % auto-calculated based on 70% rule", description: "Attendance percentage", expected: "Percentage = attended/total sessions; updates after each session", priority: "high", category: "functional" },
          { title: "Progress % auto-updates based on modules completed", description: "Student progress", expected: "Progress updates as modules marked complete", priority: "high", category: "functional" },
          { title: "Message button opens chat thread per student", description: "One thread per student", expected: "Clicking message opens chat scoped to that student", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Courses & Messages",
        description: "Course management and messaging.",
        testCases: [
          { title: "My Courses shows all courses with status", description: "Draft / Pending / Live status", expected: "Each course shows current status badge", priority: "high", category: "functional" },
          { title: "Create Course opens 12-step wizard", description: "New course creation flow", expected: "Clicking Create Course launches Step 1 of wizard", priority: "high", category: "functional" },
          { title: "Messages inbox shows all messages from students/parents", description: "Unified inbox", expected: "All conversations listed with sender name and preview", priority: "medium", category: "functional" },
          { title: "Thread view shows one thread per student", description: "Course-scoped conversations", expected: "Messages grouped by student; course context shown", priority: "medium", category: "functional" },
          { title: "Read receipt indicator shows when message was seen", description: "Read receipts", expected: "Indicator (checkmarks) shows read status with timestamp", priority: "low", category: "functional" },
          { title: "Announcements - Create new sends to all enrolled students", description: "Broadcast announcements", expected: "Announcement delivered to all enrolled students via notification", priority: "medium", category: "functional" },
          { title: "Announcements - View existing list with dates", description: "Announcement history", expected: "Past announcements listed chronologically", priority: "low", category: "functional" },
        ],
      },
      {
        name: "Performance Analytics",
        description: "Attendance, revenue, student progress analytics.",
        testCases: [
          { title: "Attendance Analytics charts show class attendance trends", description: "Charts and metrics", expected: "Line/bar chart shows attendance over time", priority: "medium", category: "functional" },
          { title: "Revenue Analytics shows earnings reports", description: "Monthly/weekly breakdown", expected: "Earnings broken down by period with totals", priority: "medium", category: "functional" },
          { title: "Student Progress shows overall performance", description: "Course completion rates", expected: "Aggregate completion rates across all students", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Ratings & Calendar",
        description: "Ratings, calendar views.",
        testCases: [
          { title: "Ratings view shows student feedback", description: "Star rating + text reviews", expected: "All reviews displayed with rating and comments", priority: "medium", category: "functional" },
          { title: "Rating Analytics shows trends", description: "Rating history", expected: "Trend chart shows rating over time", priority: "low", category: "functional" },
          { title: "Calendar Monthly View shows all classes", description: "Color-coded by course", expected: "Each course has distinct color; classes shown on correct dates", priority: "medium", category: "ui" },
          { title: "Calendar Daily View shows detailed schedule", description: "Time slots with student names", expected: "Day view shows hourly slots with student info", priority: "medium", category: "ui" },
        ],
      },
      {
        name: "Notifications & Support",
        description: "Notification preferences and support tickets.",
        testCases: [
          { title: "Notifications history shows all channels", description: "Email/SMS/WhatsApp/Push", expected: "History lists notifications with channel and timestamp", priority: "low", category: "functional" },
          { title: "Settings - Notification preferences toggle channels", description: "Channel toggles", expected: "Each channel has on/off toggle; saved per user", priority: "medium", category: "functional" },
          { title: "Support - Raise Ticket with category selection", description: "Ticket creation", expected: "Form with category dropdown, subject, description", priority: "medium", category: "functional" },
          { title: "Support - My Tickets shows ticket history", description: "Ticket history", expected: "All user's tickets listed with status tracking", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Settings",
        description: "Profile, payout, security, account deletion.",
        testCases: [
          { title: "Settings - Profile allows editing all fields", description: "Edit profile info", expected: "All profile fields editable; saved on submit", priority: "medium", category: "functional" },
          { title: "Settings - Payout allows updating bank details", description: "Update payout info", expected: "Bank details update saved; new payouts use updated info", priority: "high", category: "payment" },
          { title: "Settings - Change Password works", description: "Security password change", expected: "Old password verified; new password saved; user logged out", priority: "high", category: "security" },
          { title: "Settings - Delete Account requires confirmation", description: "Account deletion request", expected: "Confirmation modal; deletion request submitted to admin", priority: "high", category: "security" },
        ],
      },
      {
        name: "Subscription (Recording Pass)",
        description: "Recording pass subscription and slot management.",
        testCases: [
          { title: "Subscription Status shows Active/Not Subscribed/Slots Full", description: "Status indicator", expected: "Status reflects current subscription state", priority: "high", category: "functional" },
          { title: "Subscribe ₹199/month + GST via Stripe/PayPal", description: "Subscription payment", expected: "Payment processes; status becomes Active; 3 slots available", priority: "high", category: "payment" },
          { title: "Course slots show 'X of 3 courses used'", description: "Slot usage counter", expected: "Counter updates as recording enabled per course", priority: "medium", category: "functional" },
          { title: "Manage removes recording from courses to free slots", description: "Slot management", expected: "Removing recording from a course frees the slot for reuse", priority: "medium", category: "functional" },
          { title: "Cannot enable recording when all 3 slots used", description: "Slot cap enforcement", expected: "Toggle disabled when 3 slots full; teacher prompted to manage", priority: "high", category: "functional" },
        ],
      },
      {
        name: "Certificates & Community",
        description: "Certificates, community, referral, help center.",
        testCases: [
          { title: "Certificates - Issued list shows certificates given to students", description: "Issued certificates", expected: "List of certificates with student name and course", priority: "low", category: "functional" },
          { title: "Certificates - Templates allow customizable design", description: "Template management", expected: "Customizable templates with text/image fields", priority: "low", category: "functional" },
          { title: "Community - Forums for teacher discussions", description: "Peer support forums", expected: "Forum visible with categories and threads", priority: "low", category: "functional" },
          { title: "Community - Events for webinars and PD", description: "Professional development events", expected: "Events calendar with registration", priority: "low", category: "functional" },
          { title: "Referral - Link shareable for referrals", description: "Referral program", expected: "Unique referral link generated; shareable", priority: "low", category: "functional" },
          { title: "Referral - History shows list of referrals", description: "Referral history", expected: "List of referrals with status and rewards earned", priority: "low", category: "functional" },
          { title: "Help Center - FAQs accessible", description: "Self-service FAQs", expected: "FAQ page accessible from dashboard", priority: "low", category: "functional" },
          { title: "Help Center - Documentation accessible", description: "User guides", expected: "Documentation page with searchable guides", priority: "low", category: "functional" },
        ],
      },
    ],
  },
  {
    key: "course_wizard",
    name: "Course Creation Wizard",
    description: "12-step course creation flow from category to assessment creation.",
    icon: "GraduationCap",
    order: 4,
    suites: [
      {
        name: "Step 1 - Start New Course",
        description: "Platform category and sub-category selection.",
        testCases: [
          { title: "Platform Category dropdown shows Hidayah categories", description: "Quran/Tajweed/Hifz/Arabic/Islamic Studies", expected: "Hidayah platform shows Islamic categories", priority: "high", category: "functional" },
          { title: "Sub-Category dropdown shows platform-specific options", description: "Sub-categories based on platform", expected: "Sub-categories depend on selected category", priority: "medium", category: "functional" },
          { title: "Status becomes 'Course Draft Created'", description: "Initial status", expected: "New draft created in database with draft status", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Step 2 - Course Details",
        description: "Course metadata, descriptions, media.",
        testCases: [
          { title: "Course Name field is required", description: "Course title", expected: "Form cannot be submitted without name", priority: "high", category: "functional" },
          { title: "Short Description limited to 160 characters", description: "Search card description", expected: "Character counter; input blocked at 160 chars", priority: "medium", category: "functional" },
          { title: "Detailed Description supports rich text", description: "Full course description", expected: "Rich text editor with formatting (bold, lists, links)", priority: "medium", category: "ui" },
          { title: "Learning Objectives as bullet list", description: "What students will learn", expected: "Bullet list items saved as array", priority: "low", category: "functional" },
          { title: "Prerequisites text field (optional)", description: "Prior knowledge", expected: "Optional field; saves when provided", priority: "low", category: "functional" },
          { title: "Target Age Group range picker", description: "Age range selection", expected: "Range picker with min and max age", priority: "medium", category: "functional" },
          { title: "Women-only checkbox (Hidayah only)", description: "Hidayah-only toggle", expected: "Checkbox appears only for Hidayah platform", priority: "medium", category: "functional" },
          { title: "Teaching Language dropdown", description: "Language of instruction", expected: "Language dropdown saved", priority: "medium", category: "functional" },
          { title: "Thumbnail Image upload required", description: "Marketplace thumbnail", expected: "Image upload required; preview shown", priority: "high", category: "functional" },
          { title: "Promo Video upload optional", description: "Promotional video", expected: "Video upload optional; size/duration validated", priority: "low", category: "functional" },
        ],
      },
      {
        name: "Step 3 - Course Type",
        description: "Course duration types and payout models.",
        testCases: [
          { title: "One-Time Session (1 day) - payout after completion", description: "Workshop/Webinar/Demo", expected: "Payout released after session completion", priority: "high", category: "payment" },
          { title: "Short Course (2-15 days) - payout after completion", description: "Ramadan Program/Intensive", expected: "Payout released after course completion", priority: "high", category: "payment" },
          { title: "Monthly Course (16-30 days) - payout after completion", description: "Quran Reading/Arabic", expected: "Payout released after course completion", priority: "high", category: "payment" },
          { title: "Long-Term Course (1-12 months) - monthly milestone payout", description: "Hifz/Alimah Program", expected: "Monthly milestone-based payout for courses >30 days", priority: "critical", category: "payment" },
        ],
      },
      {
        name: "Step 4 - Course Structure",
        description: "Modules with mixed content types.",
        testCases: [
          { title: "Module 1 - Introduction supports Video/Meeting/PDF/Notes", description: "Course overview module", expected: "Multiple content types selectable per module", priority: "medium", category: "functional" },
          { title: "Module 2 - Lesson 1 supports all content types", description: "Core content delivery", expected: "All content types available", priority: "medium", category: "functional" },
          { title: "Module 3 - Lesson 2 supports all content types", description: "Core content delivery", expected: "All content types available", priority: "medium", category: "functional" },
          { title: "Module 4 - Assessment supports Quiz/Homework/Assignment", description: "Student evaluation", expected: "Assessment types selectable", priority: "medium", category: "functional" },
          { title: "Module 5 - Completion supports Certificate/Downloadable", description: "Course wrap-up", expected: "Certificate rules and downloadable materials", priority: "medium", category: "functional" },
          { title: "Multiple modules can be added/removed", description: "Module management", expected: "Add/remove/reorder modules works", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Step 5 - Schedule Setup",
        description: "Dates, days, time, time zone, smart availability engine.",
        testCases: [
          { title: "Start/End Date picker works", description: "Course duration", expected: "End date cannot be before start date", priority: "medium", category: "functional" },
          { title: "Days of Week multi-select works", description: "Mon-Sun selection", expected: "Multiple days selectable", priority: "medium", category: "functional" },
          { title: "Class Duration dropdown (30/45/60/90/120 min)", description: "Class length", expected: "All five options available", priority: "low", category: "functional" },
          { title: "Daily Time picker works", description: "Class time", expected: "Time picker returns valid time", priority: "low", category: "functional" },
          { title: "Time Zone auto-detected and editable", description: "Auto-detect TZ", expected: "TZ auto-populated from browser; editable", priority: "high", category: "functional" },
          { title: "Smart Availability Engine checks for conflicts", description: "Conflict detection", expected: "Slots with conflicts shown as Unavailable", priority: "critical", category: "functional" },
          { title: "Buffer time 10-15 min between classes enforced", description: "Buffer between classes", expected: "Cannot schedule back-to-back classes without buffer", priority: "high", category: "functional" },
          { title: "Recurring schedules reserve slots until course end", description: "Slot reservation", expected: "Selected slots reserved for entire course duration", priority: "high", category: "functional" },
          { title: "Editing course releases old slots, revalidates new ones", description: "Slot revalidation", expected: "Old slots freed; new slots validated against existing schedule", priority: "high", category: "functional" },
        ],
      },
      {
        name: "Step 6 - Student Capacity",
        description: "Capacity selection from 1 to Unlimited.",
        testCases: [
          { title: "Capacity 1 (Private) - one-on-one teaching", description: "Private capacity", expected: "Only 1 student can enroll", priority: "medium", category: "functional" },
          { title: "Capacity 5 (Small group)", description: "Small group capacity", expected: "Max 5 students can enroll", priority: "low", category: "functional" },
          { title: "Capacity 10 (Medium group)", description: "Medium group capacity", expected: "Max 10 students", priority: "low", category: "functional" },
          { title: "Capacity 20 (Large group)", description: "Large group capacity", expected: "Max 20 students", priority: "low", category: "functional" },
          { title: "Capacity 50 (Very large group)", description: "Very large capacity", expected: "Max 50 students", priority: "low", category: "functional" },
          { title: "Capacity Unlimited (if permitted)", description: "No cap", expected: "No enrollment cap; permitted only if allowed", priority: "low", category: "functional" },
        ],
      },
      {
        name: "Step 7a - Pricing",
        description: "Fee basis, payment options, commission, GST calculation.",
        testCases: [
          { title: "Fee Basis dropdown (Hourly/Monthly/Complete)", description: "Fee structure", expected: "Selection saved; affects payout calculation", priority: "high", category: "payment" },
          { title: "Student Payment Options checkboxes", description: "Full/3 Installments/6 Installments/Monthly Recurring", expected: "Multiple options selectable", priority: "high", category: "payment" },
          { title: "Platform Commission read-only (Hidayah 30%)", description: "Commission display", expected: "Shows 30% for Hidayah / 28% for TeachUs", priority: "high", category: "payment" },
          { title: "Teacher Receives auto-calculated (70%)", description: "Teacher share", expected: "Calculated as course fee minus commission", priority: "high", category: "payment" },
          { title: "Discount/Coupon field accepts teacher-configured discount", description: "Discount", expected: "Discount applied to course fee", priority: "medium", category: "payment" },
          { title: "Estimated Earnings auto-calculated live", description: "Live calculation", expected: "Updates as price/payment options change", priority: "medium", category: "payment" },
          { title: "GST calculation: ₹100 fee → ₹30 commission + ₹5.40 GST = ₹105.40 total, ₹70 teacher", description: "GST breakdown example", expected: "Course ₹100 + Commission ₹30 + GST (18% of ₹30) ₹5.40 = Total ₹105.40; Teacher ₹70", priority: "critical", category: "payment" },
        ],
      },
      {
        name: "Step 7b - Demo Class Configuration",
        description: "Free demo quota, paid demo pricing.",
        testCases: [
          { title: "Offer Free Demo toggle (on by default)", description: "Demo toggle", expected: "Toggle on by default; can be turned off", priority: "medium", category: "functional" },
          { title: "Free Demo Quota read-only (3 per teacher lifetime)", description: "Quota display", expected: "Shows remaining free demos; resets never (lifetime quota)", priority: "high", category: "functional" },
          { title: "Demo Duration read-only (30 min)", description: "Fixed demo duration", expected: "Cannot be changed; shows 30 min", priority: "low", category: "functional" },
          { title: "Allow Paid Demo toggle (after quota exhausted)", description: "Paid demo", expected: "Toggle enabled after free quota exhausted", priority: "medium", category: "payment" },
          { title: "Paid Demo Price read-only (₹50)", description: "Fixed paid demo price", expected: "Cannot be changed; shows ₹50", priority: "medium", category: "payment" },
        ],
      },
      {
        name: "Step 7c - Video Recording Add-On",
        description: "Recording pass subscription, slot management, lifecycle.",
        testCases: [
          { title: "Enable Recording toggle (off by default)", description: "Recording toggle", expected: "Off by default; can be toggled on if pass active", priority: "medium", category: "functional" },
          { title: "Recording Pass Status read-only (Active/Not Subscribed/Slots Full)", description: "Status display", expected: "Status reflects subscription and slot state", priority: "high", category: "functional" },
          { title: "Subscribe button ₹199/month + GST", description: "Subscription button", expected: "Opens payment flow; on success, 3 slots available", priority: "high", category: "payment" },
          { title: "Course Slot Used read-only ('2 of 3 courses used')", description: "Slot counter", expected: "Updates as recording enabled on courses", priority: "medium", category: "functional" },
          { title: "Student Cap fixed at 5 with recording enabled", description: "Recording capacity cap", expected: "Capacity cannot exceed 5 when recording enabled", priority: "high", category: "functional" },
          { title: "One Recording Pass covers up to 3 courses", description: "Pass coverage", expected: "3 course slots per active subscription", priority: "high", category: "functional" },
          { title: "Removing recording from a course frees the slot", description: "Slot management", expected: "Slot counter decrements when recording removed", priority: "medium", category: "functional" },
          { title: "Recording lifecycle: Days 1-7 both student & teacher access", description: "Initial access window", expected: "Both parties can view recording days 1-7", priority: "high", category: "functional" },
          { title: "Recording lifecycle: Days 8-15 teacher-only access", description: "Restricted access", expected: "Only teacher can access days 8-15", priority: "high", category: "functional" },
          { title: "Recording lifecycle: Days 16-28 archived, no access", description: "Archived state", expected: "Recording archived; not accessible to anyone", priority: "medium", category: "functional" },
          { title: "Recording lifecycle: Day 29 permanently deleted", description: "Permanent deletion", expected: "Recording permanently deleted from system on day 29", priority: "critical", category: "security" },
        ],
      },
      {
        name: "Step 8 - Course Policies",
        description: "Refund, attendance, certificate, assignment policies.",
        testCases: [
          { title: "Free Trial Available reflects Step 7b setting", description: "Read-only reflection", expected: "Shows true/false based on 7b toggle", priority: "low", category: "functional" },
          { title: "Refund Policy read-only (platform default rules)", description: "Refund rules", expected: "Platform refund policy displayed; not editable", priority: "medium", category: "functional" },
          { title: "Minimum Attendance Required read-only (70%)", description: "Attendance threshold", expected: "70% attendance required shown; not editable", priority: "high", category: "functional" },
          { title: "Certificate on Completion toggle", description: "Enable/disable certificate", expected: "Toggle on/off; affects student certificate eligibility", priority: "medium", category: "functional" },
          { title: "Assignment Required toggle", description: "Required for completion", expected: "Toggle; if on, assignment must be submitted", priority: "medium", category: "functional" },
          { title: "Assessment Required toggle", description: "Required for completion", expected: "Toggle; if on, assessment must be passed", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Step 9 - Review & Publish",
        description: "Validation checklist before submission.",
        testCases: [
          { title: "Validation: Teacher verified", description: "Teacher must be verified", expected: "Blocks submission if teacher not verified", priority: "critical", category: "functional" },
          { title: "Validation: Profile complete", description: "Profile must be complete", expected: "Blocks submission if profile incomplete", priority: "high", category: "functional" },
          { title: "Validation: No schedule conflicts", description: "Schedule check", expected: "Blocks submission if conflicts detected", priority: "high", category: "functional" },
          { title: "Validation: Pricing valid", description: "Pricing check", expected: "Blocks submission if pricing invalid", priority: "high", category: "functional" },
          { title: "Validation: Course content complete", description: "Content check", expected: "Blocks submission if modules incomplete", priority: "high", category: "functional" },
          { title: "Validation: Thumbnail uploaded", description: "Thumbnail check", expected: "Blocks submission if thumbnail missing", priority: "medium", category: "functional" },
          { title: "Validation: Description added", description: "Description check", expected: "Blocks submission if description empty", priority: "medium", category: "functional" },
          { title: "Validation: Duration and capacity selected", description: "Duration/capacity check", expected: "Blocks submission if missing", priority: "medium", category: "functional" },
          { title: "Validation: Payment options selected", description: "Payment options check", expected: "Blocks submission if no payment options selected", priority: "medium", category: "functional" },
          { title: "Submit changes status to 'Pending Admin Approval'", description: "Final submission", expected: "Status updates; admin notified", priority: "high", category: "functional" },
        ],
      },
      {
        name: "Step 10 - Admin Review",
        description: "Admin decision flow on submitted course.",
        testCases: [
          { title: "Approve → Course becomes Live", description: "Admin approval", expected: "Course status becomes Live; visible in marketplace", priority: "critical", category: "functional" },
          { title: "Reject → Teacher notified, can edit & resubmit", description: "Admin rejection", expected: "Teacher receives notification; can edit and resubmit", priority: "high", category: "functional" },
          { title: "Request Changes → Teacher notified of missing items", description: "Request changes", expected: "Teacher receives notification with specific items to fix", priority: "high", category: "functional" },
        ],
      },
      {
        name: "Step 11 - Marketplace Publishing",
        description: "Course appears in marketplace for discovery.",
        testCases: [
          { title: "Approved course appears in marketplace search", description: "Marketplace visibility", expected: "Course searchable; appears in relevant filter results", priority: "high", category: "functional" },
          { title: "Students can search, filter, view, compare, enroll, and pay", description: "Full discovery flow", expected: "All discovery actions available to students", priority: "high", category: "functional" },
        ],
      },
      {
        name: "Step 12 - Assessment Creation",
        description: "Assessment types created after publishing.",
        testCases: [
          { title: "Quiz (Multiple choice questions)", description: "Quiz creation", expected: "Quiz builder with MCQ creation; auto-grading", priority: "medium", category: "functional" },
          { title: "MCQ Test (Multiple choice test)", description: "MCQ test", expected: "Test creation with multiple MCQs; auto-grading", priority: "medium", category: "functional" },
          { title: "Subjective Assignment (essay/long answer)", description: "Subjective assignment", expected: "Assignment created; manual grading", priority: "medium", category: "functional" },
          { title: "Practical Task (hands-on activity)", description: "Practical task", expected: "Practical task created with submission instructions", priority: "low", category: "functional" },
          { title: "Oral Evaluation (speaking assessment)", description: "Oral evaluation", expected: "Oral assessment created; live evaluation during class", priority: "low", category: "functional" },
          { title: "Homework (take-home work)", description: "Homework assignment", expected: "Homework created with submission deadline", priority: "low", category: "functional" },
          { title: "Final Examination (end-of-course test)", description: "Final exam", expected: "Final exam created; weighted in final grade", priority: "medium", category: "functional" },
          { title: "Completion Certificate rules", description: "Certificate rules", expected: "Certificate rules configured (e.g., pass exam + 70% attendance)", priority: "medium", category: "functional" },
        ],
      },
    ],
  },
  {
    key: "student_dashboard",
    name: "Student Dashboard",
    description: "Student-facing dashboard: courses, classes, messages, analytics, payments, registration.",
    icon: "BookOpen",
    order: 5,
    suites: [
      {
        name: "Dashboard & Courses",
        description: "Student home, course list, class joining.",
        testCases: [
          { title: "Dashboard home screen shows course overview", description: "Home screen", expected: "Widgets for active courses, upcoming classes, recent messages", priority: "high", category: "ui" },
          { title: "My Courses list shows status (Active/Completed)", description: "Course list", expected: "Each course shows current status", priority: "high", category: "functional" },
          { title: "Course Detail view shows full course with schedule", description: "Course detail", expected: "Schedule, progress, assessments visible", priority: "high", category: "functional" },
          { title: "Join Class button launches live class within window", description: "Class joining", expected: "Button enabled only at scheduled time", priority: "critical", category: "functional" },
          { title: "Upcoming Classes calendar shows scheduled classes", description: "Calendar view", expected: "Date/time/teacher name visible", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Messages & Analytics",
        description: "Messaging and personal analytics.",
        testCases: [
          { title: "Messages inbox shows all messages from teachers/parents", description: "Unified inbox", expected: "All conversations listed", priority: "medium", category: "functional" },
          { title: "Thread view shows one thread per teacher", description: "Course-scoped threads", expected: "Messages grouped by teacher; course context shown", priority: "medium", category: "functional" },
          { title: "Analytics - Attendance shows per-session status", description: "Attendance analytics", expected: "Present/Absent/%attended per session", priority: "medium", category: "functional" },
          { title: "Analytics - Progress shows modules completed", description: "Progress analytics", expected: "Modules completed, time spent, streak", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Assessments & Certificates",
        description: "Assessments, grades, certificates.",
        testCases: [
          { title: "Assessments list shows all assessments", description: "Assessment list", expected: "Quiz/Test/Assignment visible with status", priority: "medium", category: "functional" },
          { title: "Results published by teacher with score and feedback", description: "Results display", expected: "Score, feedback, pass/fail shown when published", priority: "medium", category: "functional" },
          { title: "My Certificates shows earned certificates", description: "Certificate list", expected: "Course completion certificates listed", priority: "low", category: "functional" },
        ],
      },
      {
        name: "Wallet & Wishlist",
        description: "Payments and saved items.",
        testCases: [
          { title: "Payment History shows all transactions", description: "Transaction history", expected: "Course fees, refunds listed with dates", priority: "medium", category: "payment" },
          { title: "Saved Payment Method (tokenized, not stored raw)", description: "Payment method storage", expected: "Card/UPI/Netbanking tokenized; raw data never stored", priority: "high", category: "security" },
          { title: "Wishlist saves courses for future purchase", description: "Course wishlist", expected: "Saved courses visible; can move to cart", priority: "low", category: "functional" },
          { title: "Saved Teachers (favorites) for quick access", description: "Teacher favorites", expected: "Favorite teachers list with quick access to profile", priority: "low", category: "functional" },
        ],
      },
      {
        name: "Notifications & Support",
        description: "Notifications, support tickets.",
        testCases: [
          { title: "Notifications history shows all channels", description: "Notification history", expected: "Email/SMS/WhatsApp/Push notifications listed", priority: "low", category: "functional" },
          { title: "Settings - Notification Preferences toggles", description: "Channel toggles", expected: "Each channel has toggle; saved per user", priority: "medium", category: "functional" },
          { title: "Support - Raise Ticket with category selection", description: "Ticket creation", expected: "Form with category, subject, description", priority: "medium", category: "functional" },
          { title: "Support - My Tickets shows ticket history", description: "Ticket history", expected: "All student's tickets listed with status", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Settings",
        description: "Profile, payment, auto-pay, security.",
        testCases: [
          { title: "Settings - Profile edit all fields", description: "Profile editing", expected: "All profile fields editable; saved", priority: "medium", category: "functional" },
          { title: "Settings - Payment update saved payment method", description: "Payment update", expected: "New payment method replaces old; tokenized", priority: "high", category: "payment" },
          { title: "Settings - Auto-pay toggle for future installments", description: "Auto-pay", expected: "Toggle on/off; if on, installments auto-charged", priority: "high", category: "payment" },
          { title: "Settings - Change Password", description: "Password change", expected: "Old password verified; new saved; user logged out", priority: "high", category: "security" },
          { title: "Settings - Delete Account requires confirmation", description: "Account deletion", expected: "Confirmation modal; deletion request submitted", priority: "high", category: "security" },
        ],
      },
      {
        name: "Student Registration Fields",
        description: "Registration form fields and validation.",
        testCases: [
          { title: "Full Name is required", description: "Name field", expected: "Validation blocks submission without name", priority: "medium", category: "functional" },
          { title: "Email + OTP verification (unique)", description: "Email verification", expected: "OTP sent; verified; duplicates rejected", priority: "high", category: "functional" },
          { title: "Mobile + OTP verification (unique)", description: "Mobile verification", expected: "OTP sent; verified; duplicates rejected", priority: "high", category: "functional" },
          { title: "Country dropdown determines currency & payment gateway", description: "Country selection", expected: "India → INR/Razorpay; International → USD/Stripe", priority: "high", category: "functional" },
          { title: "Date of Birth triggers parent consent if under 18", description: "Age-based consent", expected: "DOB checked; if under 18, parent consent flow triggered", priority: "critical", category: "functional" },
          { title: "Parent/Guardian Name required if under 18", description: "Parent name", expected: "Field appears for under-18; required", priority: "high", category: "functional" },
          { title: "Parent/Guardian Email + OTP required if under 18", description: "Parent email verification", expected: "Parent email OTP sent; must be verified", priority: "high", category: "functional" },
          { title: "Password + Confirm Password required", description: "Password setup", expected: "Both fields required; must match; password strength validated", priority: "high", category: "security" },
        ],
      },
      {
        name: "Parent Consent Flow (Under 18)",
        description: "Multi-step parent consent workflow.",
        testCases: [
          { title: "Parent receives OTP on their mobile/email", description: "Parent OTP", expected: "OTP sent to parent's registered contact", priority: "high", category: "integration" },
          { title: "Parent consents via OTP verification", description: "Consent verification", expected: "OTP verified; consent recorded with timestamp", priority: "high", category: "functional" },
          { title: "Student registration completes after consent", description: "Registration completion", expected: "Student account created; can log in", priority: "high", category: "functional" },
          { title: "Every future purchase requires parent approval", description: "Purchase approval gate", expected: "Each purchase triggers parent notification; requires approval", priority: "critical", category: "security" },
        ],
      },
      {
        name: "Discovery & Booking",
        description: "Course discovery and booking flow.",
        testCases: [
          { title: "Search by keyword returns real-time results", description: "Search", expected: "Results update as keyword typed", priority: "high", category: "functional" },
          { title: "Filters work (gender filter is mandatory)", description: "Filter validation", expected: "Cannot search without gender filter", priority: "critical", category: "functional" },
          { title: "Teacher Profile view shows full teacher info", description: "Teacher profile", expected: "Profile, ratings, 'Starting from' price visible", priority: "high", category: "functional" },
          { title: "Book Trial/Demo (free if quota available)", description: "Free demo booking", expected: "Free demo if teacher quota available; deducted from quota", priority: "high", category: "payment" },
          { title: "Book Trial/Demo (₹50 paid if quota exhausted)", description: "Paid demo booking", expected: "If quota exhausted, ₹50 charged; payment processed", priority: "medium", category: "payment" },
          { title: "Purchase Course - Full Payment", description: "Full payment option", expected: "Full amount charged; escrow funded", priority: "high", category: "payment" },
          { title: "Purchase Course - 3 Installments", description: "3-installment plan", expected: "3 equal payments; scheduled dates", priority: "high", category: "payment" },
          { title: "Purchase Course - 6 Installments", description: "6-installment plan", expected: "6 equal payments; scheduled dates", priority: "medium", category: "payment" },
          { title: "Purchase Course - Monthly Recurring", description: "Monthly recurring", expected: "Monthly auto-charge until course end or cancelled", priority: "medium", category: "payment" },
        ],
      },
      {
        name: "Checkout Breakdown",
        description: "Transparent pricing at checkout.",
        testCases: [
          { title: "Course fee displayed at checkout", description: "Fee display", expected: "Course fee shown as line item", priority: "high", category: "payment" },
          { title: "Platform commission displayed (30%/28%)", description: "Commission display", expected: "Hidayah 30% / TeachUs 28% shown", priority: "high", category: "payment" },
          { title: "GST (18% of commission) shown as separate line item", description: "GST display", expected: "GST shown separately from course fee", priority: "high", category: "payment" },
          { title: "Total = Course fee + GST on commission", description: "Total calculation", expected: "Total equals course fee + GST; commission deducted from teacher share", priority: "high", category: "payment" },
          { title: "Teacher receives 70% (Hidayah) or 72% (TeachUs)", description: "Teacher share", expected: "Teacher share correctly calculated", priority: "high", category: "payment" },
        ],
      },
    ],
  },
  {
    key: "admin_dashboard",
    name: "Admin Dashboard",
    description: "Admin control panel: approvals, disputes, escrow, revenue, CMS, settings.",
    icon: "Shield",
    order: 6,
    suites: [
      {
        name: "Dashboard & Overview",
        description: "Top-level metrics and statistics.",
        testCases: [
          { title: "Dashboard overview shows all metrics summarized", description: "Overview screen", expected: "KPIs for users, courses, revenue, transactions visible", priority: "high", category: "ui" },
          { title: "Overview - Statistics page with detailed metrics", description: "Statistics page", expected: "Detailed breakdowns by category and time period", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Pending Approvals",
        description: "Teacher, student, and course approval queues.",
        testCases: [
          { title: "Pending Teachers list shows teachers awaiting verification", description: "Teacher queue", expected: "List shows submitted date and documents", priority: "high", category: "functional" },
          { title: "Pending Teachers - Review detailed view", description: "Review screen", expected: "Verify identity, qualifications, payout details", priority: "high", category: "functional" },
          { title: "Pending Teachers - Decision (Approve/Reject/Request Info/Suspend/Blacklist)", description: "Decision actions", expected: "All five actions available; updates teacher status", priority: "critical", category: "functional" },
          { title: "Pending Students list shows students awaiting approval", description: "Student queue", expected: "Under-18 consent pending students listed", priority: "high", category: "functional" },
          { title: "Pending Students - Review student detail", description: "Student review", expected: "Profile and parent consent status visible", priority: "medium", category: "functional" },
          { title: "Pending Students - Decision (Approve/Reject)", description: "Student decision", expected: "Both actions update student status", priority: "high", category: "functional" },
          { title: "Pending Courses list shows courses awaiting approval", description: "Course queue", expected: "List shows teacher, category, status", priority: "high", category: "functional" },
          { title: "Pending Courses - Review course detail", description: "Course review", expected: "Content, pricing, schedule visible", priority: "high", category: "functional" },
          { title: "Pending Courses - Decision (Approve/Reject/Request Changes)", description: "Course decision", expected: "All three actions available; updates course status", priority: "critical", category: "functional" },
        ],
      },
      {
        name: "Live Classes & Monitoring",
        description: "Active class monitoring.",
        testCases: [
          { title: "Live Classes list shows all active classes", description: "Class list", expected: "Teacher, student, time visible for each class", priority: "medium", category: "functional" },
          { title: "Monitoring shows session status", description: "Session monitoring", expected: "Join/leave times, duration visible", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Disputes & Refunds",
        description: "Dispute resolution and refund processing.",
        testCases: [
          { title: "Disputes list shows open disputes", description: "Dispute queue", expected: "Teacher-student disagreements listed", priority: "high", category: "functional" },
          { title: "Disputes - Resolution review both sides", description: "Dispute review", expected: "Both parties' evidence visible to admin", priority: "high", category: "functional" },
          { title: "Disputes - Decision maker on escrow release", description: "Escrow decision", expected: "Admin decides whether to release escrow to teacher or refund student", priority: "critical", category: "payment" },
          { title: "Refund Requests list shows all requests", description: "Refund queue", expected: "Student, course, reason, evidence visible", priority: "high", category: "functional" },
          { title: "Refund Requests - Decision (Approve/Reject)", description: "Refund decision", expected: "Approve → refund issued from escrow; Reject → student notified", priority: "critical", category: "payment" },
        ],
      },
      {
        name: "Escrow & Wallets",
        description: "Escrow management and wallet oversight.",
        testCases: [
          { title: "Escrow Balance view shows all balances", description: "Escrow overview", expected: "Filter by teacher/course/student available", priority: "high", category: "payment" },
          { title: "Escrow Transaction History shows all transactions", description: "Transaction log", expected: "Date, amount, status for every escrow transaction", priority: "medium", category: "payment" },
          { title: "Teacher Wallets show Available/Pending/Locked", description: "Teacher wallets", expected: "All three balance types visible per teacher", priority: "high", category: "payment" },
          { title: "Student Wallets show payment history", description: "Student wallets", expected: "Payment history per student visible", priority: "medium", category: "payment" },
        ],
      },
      {
        name: "Revenue & Commission",
        description: "Revenue analytics and commission tracking.",
        testCases: [
          { title: "Revenue Reports show commission collected", description: "Revenue reports", expected: "Total commission collected with breakdown", priority: "high", category: "payment" },
          { title: "Revenue Analytics charts and trends", description: "Revenue analytics", expected: "Monthly/yearly breakdown charts", priority: "medium", category: "functional" },
          { title: "Commission Reports by teacher and by course", description: "Commission reports", expected: "Commission broken down by teacher and course", priority: "medium", category: "payment" },
          { title: "Commission Rates display (Hidayah 30%, TeachUs 28%)", description: "Rate display", expected: "Both platform rates visible; editable by super admin", priority: "medium", category: "payment" },
        ],
      },
      {
        name: "Subscriptions & Reports",
        description: "Recording pass subscriptions and custom reports.",
        testCases: [
          { title: "Subscriptions - Recording Passes list", description: "Subscription list", expected: "Teacher, course count, status visible", priority: "medium", category: "payment" },
          { title: "Subscriptions - Revenue (MRR)", description: "Subscription revenue", expected: "Monthly recurring revenue from subscriptions", priority: "medium", category: "payment" },
          { title: "Reports - All pre-built reports", description: "Pre-built reports", expected: "Usage, revenue, user metrics reports available", priority: "medium", category: "functional" },
          { title: "Reports - Custom Reports builder", description: "Custom reports", expected: "Filterable by date, user, course", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "Certificates & Institutes",
        description: "Certificate templates and institute management.",
        testCases: [
          { title: "Certificate Templates - all templates", description: "Template management", expected: "All templates visible; design and management tools", priority: "low", category: "functional" },
          { title: "Issued Certificates - by course and by student", description: "Issued certificates", expected: "Searchable by course and student", priority: "low", category: "functional" },
          { title: "Institute Management - Add/Edit/Delete partner institutes", description: "Institute management", expected: "Full CRUD on partner institutes", priority: "medium", category: "functional" },
          { title: "Institute Admins - manage access", description: "Admin management", expected: "Add/remove institute administrators; control access", priority: "medium", category: "security" },
        ],
      },
      {
        name: "Support Tickets & Notifications",
        description: "Ticket queue and notification management.",
        testCases: [
          { title: "Support Tickets - Ticket Queue with filters", description: "Ticket queue", expected: "Filter by status, category, priority", priority: "high", category: "functional" },
          { title: "Support Tickets - Ticket Detail with related records", description: "Ticket detail", expected: "Full ticket view with related records and resolution", priority: "medium", category: "functional" },
          { title: "Notifications - All notification history", description: "Notification history", expected: "All channels (Email/SMS/WhatsApp/Push) listed", priority: "low", category: "functional" },
          { title: "Notifications - Broadcast announcements", description: "Broadcast", expected: "Send to all users or selected groups", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "CMS & Settings",
        description: "Content management and platform settings.",
        testCases: [
          { title: "CMS - Pages Content Management", description: "Page CMS", expected: "Landing page, FAQ, About Us editable", priority: "medium", category: "functional" },
          { title: "CMS - Global Announcements on all pages", description: "Global announcements", expected: "Announcements displayed across all pages", priority: "medium", category: "functional" },
          { title: "Settings - Platform Settings (fees, commissions, policies)", description: "Platform settings", expected: "Global settings editable with audit trail", priority: "high", category: "security" },
          { title: "Settings - User Management (Suspend/Activate/Delete)", description: "User management", expected: "All user actions available; logged in audit", priority: "high", category: "security" },
          { title: "Settings - Audit Log shows all admin actions", description: "Audit log", expected: "Complete audit trail of all admin actions", priority: "high", category: "security" },
        ],
      },
    ],
  },
  {
    key: "support_ticketing",
    name: "Support & Ticketing System",
    description: "Ticket creation, workflow, SLA, escalation, and resolution tracking.",
    icon: "LifeBuoy",
    order: 7,
    suites: [
      {
        name: "Raising a Ticket",
        description: "Ticket creation form and fields.",
        testCases: [
          { title: "Category dropdown shows all categories", description: "Category selection", expected: "Payment/Payout/Technical/Account/Course/Dispute/Other", priority: "high", category: "functional" },
          { title: "Related Record auto-filled (optional)", description: "Related record linking", expected: "Course ID/Payment ID/Payout ID auto-filled when context available", priority: "medium", category: "functional" },
          { title: "Subject text field accepts brief description", description: "Subject field", expected: "Required; character limit reasonable (e.g., 100 chars)", priority: "medium", category: "functional" },
          { title: "Description text field accepts detailed issue", description: "Description field", expected: "Long text field; supports formatting", priority: "medium", category: "functional" },
          { title: "Ticket ID auto-generated on submission", description: "Ticket ID", expected: "Unique ticket ID generated and shown to user", priority: "medium", category: "functional" },
          { title: "File attachments supported", description: "Attachments", expected: "Screenshots/documents can be attached (image/PDF)", priority: "medium", category: "functional" },
          { title: "Ticket submission triggers confirmation notification", description: "Confirmation", expected: "User receives email/SMS confirmation with ticket ID", priority: "high", category: "integration" },
        ],
      },
      {
        name: "Ticket Workflow",
        description: "Ticket lifecycle and status transitions.",
        testCases: [
          { title: "Ticket status transitions: Open → In Progress → Resolved → Closed", description: "Status workflow", expected: "Each transition logged with timestamp and user", priority: "high", category: "functional" },
          { title: "Ticket assignment to support agent", description: "Assignment", expected: "Admin can assign ticket; assignee notified", priority: "medium", category: "functional" },
          { title: "Ticket reassignment allowed with reason", description: "Reassignment", expected: "Reassignment logged with reason", priority: "low", category: "functional" },
          { title: "Ticket resolution requires comment", description: "Resolution requirement", expected: "Cannot mark resolved without comment", priority: "medium", category: "functional" },
          { title: "Ticket closure requires user confirmation", description: "Closure confirmation", expected: "User must confirm resolution before closure", priority: "medium", category: "functional" },
          { title: "Ticket reopen within 7 days of closure", description: "Reopen window", expected: "Ticket can be reopened within 7 days; after that, new ticket required", priority: "medium", category: "functional" },
        ],
      },
      {
        name: "SLA & Escalation",
        description: "Service Level Agreement and escalation matrix.",
        testCases: [
          { title: "SLA: Critical tickets responded within 2 hours", description: "Critical SLA", expected: "Auto-escalation if no response in 2 hours", priority: "high", category: "functional" },
          { title: "SLA: High priority tickets responded within 8 hours", description: "High SLA", expected: "Auto-escalation if no response in 8 hours", priority: "medium", category: "functional" },
          { title: "SLA: Medium priority tickets responded within 24 hours", description: "Medium SLA", expected: "Auto-escalation if no response in 24 hours", priority: "medium", category: "functional" },
          { title: "SLA: Low priority tickets responded within 72 hours", description: "Low SLA", expected: "Auto-escalation if no response in 72 hours", priority: "low", category: "functional" },
          { title: "Escalation to supervisor when SLA breached", description: "Escalation", expected: "Supervisor notified; ticket flagged as escalated", priority: "high", category: "functional" },
          { title: "SLA breach visible on ticket", description: "Breach indicator", expected: "Visual indicator (red) when SLA breached", priority: "medium", category: "ui" },
        ],
      },
      {
        name: "Communication & Resolution",
        description: "Back-and-forth communication and resolution tracking.",
        testCases: [
          { title: "Ticket thread shows all communication", description: "Communication thread", expected: "All messages visible chronologically with author", priority: "high", category: "functional" },
          { title: "Email notifications on each ticket update", description: "Email updates", expected: "Both user and agent receive email on each update", priority: "medium", category: "integration" },
          { title: "Internal notes (private) visible only to agents", description: "Internal notes", expected: "Private notes not visible to user", priority: "medium", category: "security" },
          { title: "Resolution template selection", description: "Resolution templates", expected: "Pre-defined templates for common resolutions", priority: "low", category: "functional" },
          { title: "Satisfaction survey after closure", description: "CSAT survey", expected: "Survey sent 24 hours after closure; rating captured", priority: "medium", category: "functional" },
        ],
      },
    ],
  },
];
