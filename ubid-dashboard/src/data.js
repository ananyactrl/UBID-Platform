export const dashboardStats = {
  totalRecords: "14,250,891",
  resolvedUBIDs: "4,102,560",
  active: "65%",
  dormant: "22%",
  closed: "13%",
  pendingReviews: "12,450"
};

export const activityData = [
  { name: 'Jan', Shops: 4000, Factories: 2400, Pollution: 2400 },
  { name: 'Feb', Shops: 3000, Factories: 1398, Pollution: 2210 },
  { name: 'Mar', Shops: 2000, Factories: 9800, Pollution: 2290 },
  { name: 'Apr', Shops: 2780, Factories: 3908, Pollution: 2000 },
  { name: 'May', Shops: 1890, Factories: 4800, Pollution: 2181 },
  { name: 'Jun', Shops: 2390, Factories: 3800, Pollution: 2500 },
];

// ── Multiple entity resolution examples ──────────────────────────────────────
export const entityResolutionExamples = [
  {
    ubid: "UBID-2026-KA-883A",
    confidenceScore: 96,
    status: "ACTIVE",
    nodes: [
      { id: "1", label: "M/s Ganesh Bakery",      dept: "Shops & Establishment" },
      { id: "2", label: "Ganesh Bakery Pvt Ltd",   dept: "Factories" },
      { id: "3", label: "Sri Ganesh Bakers",        dept: "Pollution Control" },
      { id: "UBID", label: "UBID-883A", isMain: true }
    ],
    scores: [95, 96, 92],
    timeline: [
      { date: "10 May 2024", event: "Shops Inspection",  source: "Shops Dept",     impact: "+0.30 Boost" },
      { date: "12 May 2024", event: "Factory Renewal",   source: "Factories Dept", impact: "+0.30 Boost" },
      { date: "14 May 2024", event: "Pollution NOC",     source: "Pollution Dept", impact: "+0.30 Boost" }
    ],
    insight: "Consistent 2-day lag pattern detected across departments. Similarity score boosted!"
  },
  {
    ubid: "UBID-2026-KA-441C",
    confidenceScore: 98,
    status: "ACTIVE",
    nodes: [
      { id: "1", label: "Sunrise Textiles",         dept: "Factories" },
      { id: "2", label: "Sunrise Textile Works",    dept: "Electricity Board" },
      { id: "3", label: "M/s Sunrise Tex",          dept: "Fire Safety" },
      { id: "UBID", label: "UBID-441C", isMain: true }
    ],
    scores: [97, 98, 94],
    timeline: [
      { date: "03 Mar 2024", event: "Factory Audit",       source: "Factories Dept",   impact: "+0.30 Boost" },
      { date: "05 Mar 2024", event: "Electricity Renewal", source: "Electricity Board", impact: "+0.30 Boost" },
      { date: "07 Mar 2024", event: "Fire NOC Issued",     source: "Fire Safety Dept", impact: "+0.30 Boost" }
    ],
    insight: "PAN match confirmed. 2-day lag pattern across 3 departments over 6 cycles."
  },
  {
    ubid: "UBID-2026-KA-772D",
    confidenceScore: 93,
    status: "DORMANT",
    nodes: [
      { id: "1", label: "Kaveri Cold Storage",      dept: "Shops & Establishment" },
      { id: "2", label: "Kaveri Cold Store Pvt",    dept: "Pollution Control" },
      { id: "3", label: "K.C. Storage Solutions",   dept: "Electricity Board" },
      { id: "UBID", label: "UBID-772D", isMain: true }
    ],
    scores: [93, 91, 88],
    timeline: [
      { date: "15 Jan 2023", event: "Shops Inspection",    source: "Shops Dept",       impact: "+0.30 Boost" },
      { date: "17 Jan 2023", event: "Pollution Check",     source: "Pollution Dept",   impact: "+0.30 Boost" },
      { date: "19 Jan 2023", event: "Meter Reading",       source: "Electricity Board", impact: "+0.20 Boost" }
    ],
    insight: "Last activity Jan 2023. Phonetic name match (Soundex) boosted score despite abbreviation."
  },
  {
    ubid: "UBID-2026-KA-119F",
    confidenceScore: 97,
    status: "CLOSED",
    nodes: [
      { id: "1", label: "Deccan Auto Parts",        dept: "Shops & Establishment" },
      { id: "2", label: "Deccan Automobile Parts",  dept: "Factories" },
      { id: "3", label: "Deccan Auto Pvt Ltd",      dept: "GST Portal" },
      { id: "UBID", label: "UBID-119F", isMain: true }
    ],
    scores: [97, 95, 96],
    timeline: [
      { date: "10 Jun 2022", event: "Shops Inspection",  source: "Shops Dept",     impact: "+0.30 Boost" },
      { date: "12 Jun 2022", event: "Factory Audit",     source: "Factories Dept", impact: "+0.30 Boost" },
      { date: "30 Sep 2022", event: "GST Cancellation",  source: "GST Portal",     impact: "CLOSED Flag" }
    ],
    insight: "GST cancellation event triggered CLOSED classification. Temporal veto passed — no post-closure activity."
  }
];

// ── Multiple reviewer queue items ─────────────────────────────────────────────
export const reviewerQueueItems = [
  {
    id: "REV-9012",
    confidence: 82,
    recordA: {
      source: "Shops & Establishment",
      name: "Ramesh Traders",
      address: "12, MG Road, BGLR",
      pincode: "560001",
      pan: "ABCDE1234F",
      lastEvent: "2023-11-20"
    },
    recordB: {
      source: "Electricity Board",
      name: "Ramesh Enterprises",
      address: "No 12, M G Road, Blore",
      pincode: "560001",
      pan: "Missing",
      lastEvent: "2023-11-22"
    },
    issues: ["Name mismatch (Jaro-Winkler 85%)", "PAN Missing in Record B"],
    recommendation: "Merge (High Behavioural Correlation)"
  },
  {
    id: "REV-9013",
    confidence: 76,
    recordA: {
      source: "Factories Dept",
      name: "Shree Lakshmi Mills",
      address: "Plot 44, Peenya Industrial Area",
      pincode: "560058",
      pan: "FGHIJ5678K",
      lastEvent: "2024-01-15"
    },
    recordB: {
      source: "Pollution Control",
      name: "Sri Lakshmi Textile Mills",
      address: "44, Peenya Indl. Area, Blore",
      pincode: "560058",
      pan: "FGHIJ5678K",
      lastEvent: "2024-01-17"
    },
    issues: ["Name mismatch (Jaro-Winkler 79%)", "Address abbreviation differs"],
    recommendation: "Merge (PAN Match + 2-day Behavioural Lag)"
  },
  {
    id: "REV-9014",
    confidence: 71,
    recordA: {
      source: "GST Portal",
      name: "Nandi Agro Foods",
      address: "Survey No. 12, Tumkur Road",
      pincode: "572101",
      pan: "KLMNO9012P",
      lastEvent: "2023-08-10"
    },
    recordB: {
      source: "Shops & Establishment",
      name: "Nandi Agro Food Products",
      address: "S.No 12, Tumkur Rd, Tumkur",
      pincode: "572101",
      pan: "Missing",
      lastEvent: "2023-08-12"
    },
    issues: ["PAN Missing in Record B", "Name suffix mismatch", "Address format differs"],
    recommendation: "Merge (Phonetic + Pincode + Temporal Match)"
  },
  {
    id: "REV-9015",
    confidence: 88,
    recordA: {
      source: "Fire Safety Dept",
      name: "Hotel Kamath Residency",
      address: "15/A, Brigade Road, Bangalore",
      pincode: "560025",
      pan: "QRSTU3456V",
      lastEvent: "2024-03-05"
    },
    recordB: {
      source: "Electricity Board",
      name: "Kamath Residency Hotel",
      address: "15-A Brigade Rd, BGLR",
      pincode: "560025",
      pan: "QRSTU3456V",
      lastEvent: "2024-03-07"
    },
    issues: ["Word order mismatch in name", "Address format differs"],
    recommendation: "Merge (PAN Match + High Name Similarity 91%)"
  },
  {
    id: "REV-9016",
    confidence: 74,
    recordA: {
      source: "Factories Dept",
      name: "Mysore Paper Mills Ltd",
      address: "Bhadravathi, Shimoga Dist",
      pincode: "577301",
      pan: "WXYZA7890B",
      lastEvent: "2022-12-20"
    },
    recordB: {
      source: "Pollution Control",
      name: "MPM Limited",
      address: "Bhadravathi, Shivamogga",
      pincode: "577301",
      pan: "Missing",
      lastEvent: "2022-12-22"
    },
    issues: ["Abbreviation vs full name (Jaro-Winkler 61%)", "District name spelling differs", "PAN Missing"],
    recommendation: "Merge (Pincode + Temporal + Known Abbreviation Pattern)"
  },
  {
    id: "REV-9017",
    confidence: 79,
    recordA: {
      source: "Shops & Establishment",
      name: "Udupi Krishna Bhavan",
      address: "23, Gandhi Bazaar, Bangalore",
      pincode: "560004",
      pan: "CDEFG2345H",
      lastEvent: "2024-02-14"
    },
    recordB: {
      source: "GST Portal",
      name: "Krishna Bhavan Udupi Restaurant",
      address: "No.23 Gandhi Bazar, BGLR",
      pincode: "560004",
      pan: "CDEFG2345H",
      lastEvent: "2024-02-16"
    },
    issues: ["Word order mismatch", "Address abbreviation"],
    recommendation: "Merge (PAN Match + 2-day Lag + Pincode Match)"
  }
];

// ── Portal lookup data ────────────────────────────────────────────────────────
export const portalLookupData = {
  "ABCDE1234F": {
    ubid: "UBID-2026-KA-883A",
    businessName: "Ganesh Bakery (Unified)",
    status: "ACTIVE",
    pan: "ABCDE1234F",
    gstin: "29ABCDE1234F1Z5",
    owner: "Ganesh R. Sharma",
    pincode: "560001",
    linkedRecords: [
      { source: "Shops & Establishment", id: "SH-10291", name: "M/s Ganesh Bakery",     lastEvent: "2024-05-10" },
      { source: "Factories Dept",        id: "FA-88321", name: "Ganesh Bakery Pvt Ltd", lastEvent: "2024-05-12" },
      { source: "Pollution Control",     id: "PC-44102", name: "Sri Ganesh Bakers",      lastEvent: "2024-05-14" }
    ],
    classificationReason: "3 events in last 90 days. Cohort median: 2. Score: 0.87 → ACTIVE",
    lastUpdated: "2024-05-14"
  },
  "XYZPQ9876G": {
    ubid: "UBID-2026-KA-221B",
    businessName: "Ramesh Traders",
    status: "DORMANT",
    pan: "XYZPQ9876G",
    gstin: "29XYZPQ9876G1Z3",
    owner: "Ramesh K.",
    pincode: "560034",
    linkedRecords: [
      { source: "Shops & Establishment", id: "SH-20045", name: "Ramesh Traders",     lastEvent: "2023-11-20" },
      { source: "Electricity Board",     id: "EB-77210", name: "Ramesh Enterprises", lastEvent: "2023-11-22" }
    ],
    classificationReason: "Last event 180+ days ago. Cohort median: 4. Score: 0.21 → DORMANT",
    lastUpdated: "2023-11-22"
  },
  "FGHIJ5678K": {
    ubid: "UBID-2026-KA-441C",
    businessName: "Shree Lakshmi Mills (Unified)",
    status: "ACTIVE",
    pan: "FGHIJ5678K",
    gstin: "29FGHIJ5678K1Z7",
    owner: "Lakshmi Devi N.",
    pincode: "560058",
    linkedRecords: [
      { source: "Factories Dept",    id: "FA-33201", name: "Shree Lakshmi Mills",         lastEvent: "2024-01-15" },
      { source: "Pollution Control", id: "PC-55410", name: "Sri Lakshmi Textile Mills",   lastEvent: "2024-01-17" }
    ],
    classificationReason: "2 events in last 60 days. Cohort median: 2. Score: 0.74 → ACTIVE",
    lastUpdated: "2024-01-17"
  },
  "WXYZA7890B": {
    ubid: "UBID-2026-KA-119F",
    businessName: "Mysore Paper Mills Ltd",
    status: "CLOSED",
    pan: "WXYZA7890B",
    gstin: "29WXYZA7890B1Z2",
    owner: "Karnataka Govt. (PSU)",
    pincode: "577301",
    linkedRecords: [
      { source: "Factories Dept",    id: "FA-00112", name: "Mysore Paper Mills Ltd", lastEvent: "2022-12-20" },
      { source: "Pollution Control", id: "PC-00891", name: "MPM Limited",            lastEvent: "2022-12-22" }
    ],
    classificationReason: "No events since Dec 2022. Closure notice filed. Score: 0.04 → CLOSED",
    lastUpdated: "2022-12-22"
  }
};
