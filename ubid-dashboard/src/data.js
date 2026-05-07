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

export const entityResolutionExample = {
  ubid: "UBID-2026-KA-883A",
  confidenceScore: 96,
  status: "ACTIVE",
  nodes: [
    { id: "1", label: "M/s Ganesh Bakery", dept: "Shops & Establishment", date: "2024-05-10" },
    { id: "2", label: "Ganesh Bakery Pvt Ltd", dept: "Factories", date: "2024-05-12" },
    { id: "3", label: "Sri Ganesh Bakers", dept: "Pollution Control", date: "2024-05-14" },
    { id: "UBID", label: "UBID-883A", isMain: true }
  ],
  links: [
    { source: "1", target: "UBID", score: 95 },
    { source: "2", target: "UBID", score: 96 },
    { source: "3", target: "UBID", score: 92 },
    { source: "1", target: "2", reason: "Behavioural Fingerprint Match (2 days diff)" },
    { source: "2", target: "3", reason: "Behavioural Fingerprint Match (2 days diff)" }
  ],
  timeline: [
    { date: "10 May 2024", event: "Shops Inspection", source: "Shops Dept", impact: "+0.30 Boost" },
    { date: "12 May 2024", event: "Factory Renewal", source: "Factories Dept", impact: "+0.30 Boost" },
    { date: "14 May 2024", event: "Pollution NOC", source: "Pollution Dept", impact: "+0.30 Boost" }
  ]
};

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
      { source: "Shops & Establishment", id: "SH-10291", name: "M/s Ganesh Bakery", lastEvent: "2024-05-10" },
      { source: "Factories Dept", id: "FA-88321", name: "Ganesh Bakery Pvt Ltd", lastEvent: "2024-05-12" },
      { source: "Pollution Control", id: "PC-44102", name: "Sri Ganesh Bakers", lastEvent: "2024-05-14" }
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
      { source: "Shops & Establishment", id: "SH-20045", name: "Ramesh Traders", lastEvent: "2023-11-20" },
      { source: "Electricity Board", id: "EB-77210", name: "Ramesh Enterprises", lastEvent: "2023-11-22" }
    ],
    classificationReason: "Last event 180+ days ago. Cohort median: 4. Score: 0.21 → DORMANT",
    lastUpdated: "2023-11-22"
  }
};

export const reviewerQueueExample = [
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
  }
];
