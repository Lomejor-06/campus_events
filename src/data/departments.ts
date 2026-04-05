export interface Department {
  id: number;
  name: string;
  code: string;
  college: string;
}

export const LASUSTECH_COLLEGES = [
  'College of Engineering and Technology',
  'College of Basic Sciences',
  'College of Applied Social Sciences',
  'College of Environmental Design and Technology',
  'College of Agriculture',
] as const;

export const LASUSTECH_DEPARTMENTS: Department[] = [
  // ── College of Engineering and Technology ──
  { id: 1, name: 'Agricultural and Biosystems Engineering', code: 'ABE', college: 'College of Engineering and Technology' },
  { id: 2, name: 'Chemical Engineering', code: 'CHE', college: 'College of Engineering and Technology' },
  { id: 3, name: 'Civil and Construction Engineering', code: 'CVE', college: 'College of Engineering and Technology' },
  { id: 4, name: 'Computer Engineering', code: 'CPE', college: 'College of Engineering and Technology' },
  { id: 5, name: 'Electrical/Electronics Engineering', code: 'EEE', college: 'College of Engineering and Technology' },
  { id: 6, name: 'Mechanical Engineering', code: 'MEE', college: 'College of Engineering and Technology' },
  { id: 7, name: 'Mechatronics Engineering', code: 'MCE', college: 'College of Engineering and Technology' },
  { id: 8, name: 'Biotechnology and Food Technology', code: 'BFT', college: 'College of Engineering and Technology' },

  // ── College of Basic Sciences ──
  { id: 9, name: 'Botany', code: 'BOT', college: 'College of Basic Sciences' },
  { id: 10, name: 'Chemistry / Industrial Chemistry', code: 'CHM', college: 'College of Basic Sciences' },
  { id: 11, name: 'Computer Science', code: 'CSC', college: 'College of Basic Sciences' },
  { id: 12, name: 'Mathematics / Industrial Mathematics', code: 'MTH', college: 'College of Basic Sciences' },
  { id: 13, name: 'Microbiology', code: 'MCB', college: 'College of Basic Sciences' },
  { id: 14, name: 'Physics with Electronics', code: 'PHY', college: 'College of Basic Sciences' },
  { id: 15, name: 'Statistics', code: 'STA', college: 'College of Basic Sciences' },
  { id: 16, name: 'Zoology', code: 'ZOO', college: 'College of Basic Sciences' },

  // ── College of Applied Social Sciences ──
  { id: 17, name: 'Accounting', code: 'ACC', college: 'College of Applied Social Sciences' },
  { id: 18, name: 'Actuarial Science', code: 'ACS', college: 'College of Applied Social Sciences' },
  { id: 19, name: 'Banking and Finance', code: 'BFN', college: 'College of Applied Social Sciences' },
  { id: 20, name: 'Business Administration', code: 'BUS', college: 'College of Applied Social Sciences' },
  { id: 21, name: 'Economics', code: 'ECO', college: 'College of Applied Social Sciences' },
  { id: 22, name: 'Insurance', code: 'INS', college: 'College of Applied Social Sciences' },
  { id: 23, name: 'Marketing', code: 'MKT', college: 'College of Applied Social Sciences' },
  { id: 24, name: 'Mass Communication', code: 'MAC', college: 'College of Applied Social Sciences' },
  { id: 25, name: 'Office and Information Technology', code: 'OIT', college: 'College of Applied Social Sciences' },
  { id: 26, name: 'Tourism and Hospitality Management', code: 'THM', college: 'College of Applied Social Sciences' },

  // ── College of Environmental Design and Technology ──
  { id: 27, name: 'Architecture', code: 'ARC', college: 'College of Environmental Design and Technology' },
  { id: 28, name: 'Art and Industrial Design', code: 'AID', college: 'College of Environmental Design and Technology' },
  { id: 29, name: 'Building Technology', code: 'BLD', college: 'College of Environmental Design and Technology' },
  { id: 30, name: 'Estate Management and Valuation', code: 'EMV', college: 'College of Environmental Design and Technology' },
  { id: 31, name: 'Quantity Surveying', code: 'QSV', college: 'College of Environmental Design and Technology' },
  { id: 32, name: 'Urban and Regional Planning', code: 'URP', college: 'College of Environmental Design and Technology' },

  // ── College of Agriculture ──
  { id: 33, name: 'Agricultural Economics and Farm Management', code: 'AEM', college: 'College of Agriculture' },
  { id: 34, name: 'Agricultural Extension and Rural Development', code: 'AER', college: 'College of Agriculture' },
  { id: 35, name: 'Animal Breeding and Genetics', code: 'ABG', college: 'College of Agriculture' },
  { id: 36, name: 'Animal Production', code: 'ANP', college: 'College of Agriculture' },
  { id: 37, name: 'Aquaculture and Fisheries Management', code: 'AFM', college: 'College of Agriculture' },
  { id: 38, name: 'Crop Production', code: 'CRP', college: 'College of Agriculture' },
  { id: 39, name: 'Horticulture and Landscape Management', code: 'HLM', college: 'College of Agriculture' },
];

/** Group departments by college for use in <optgroup> selects */
export function getDepartmentsByCollege(): Record<string, Department[]> {
  const grouped: Record<string, Department[]> = {};
  for (const dept of LASUSTECH_DEPARTMENTS) {
    if (!grouped[dept.college]) grouped[dept.college] = [];
    grouped[dept.college].push(dept);
  }
  return grouped;
}

/** Get a department by ID */
export function getDepartmentById(id: number): Department | undefined {
  return LASUSTECH_DEPARTMENTS.find(d => d.id === id);
}
