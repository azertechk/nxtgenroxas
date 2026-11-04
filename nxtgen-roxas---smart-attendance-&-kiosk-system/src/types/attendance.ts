export type LevelId =
  | 'aquarium'
  | 'level_1'
  | 'level_2'
  | 'level_3'
  | 'level_4';

export interface LevelDefinition {
  id: LevelId;
  name: string;
  roomName: string;
  ageRange: string;
  minAge: number;
  maxAge: number;
  color: string; // Hex color code
  headerGradient: string; // Gradient class for card headers and badges
  badgeBg: string; // Soft pill badge styling
  solidBg: string; // Solid colored background button/pill
  borderColor: string;
  textColor: string;
  description: string;
  ratioGuidelines: string; // e.g. "1 Teacher : 3 Toddlers"
}

export const NXTGEN_LEVELS: LevelDefinition[] = [
  {
    id: 'aquarium',
    name: "Tots' Place",
    roomName: "Tots' Place (Room 101)",
    ageRange: 'Ages 1-3',
    minAge: 1,
    maxAge: 3,
    color: '#8B5CF6', // Purple
    headerGradient: 'from-[#8B5CF6] to-[#7C3AED]',
    badgeBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    solidBg: 'bg-[#8B5CF6] text-white',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-600 dark:text-purple-400',
    description: "Toddlers and infants sensory exploration, music, and prayer care.",
    ratioGuidelines: '1 Teacher : 3 Kids',
  },
  {
    id: 'level_1',
    name: 'Level 1',
    roomName: 'Joy Hall (Room 102)',
    ageRange: 'Ages 4-5',
    minAge: 4,
    maxAge: 5,
    color: '#0EA5E9', // Sky Blue
    headerGradient: 'from-[#0EA5E9] to-[#0284c7]',
    badgeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    solidBg: 'bg-[#0EA5E9] text-white',
    borderColor: 'border-sky-500',
    textColor: 'text-sky-600 dark:text-sky-400',
    description: 'Kindergarten praise, puppet stories, interactive coloring and crafts.',
    ratioGuidelines: '1 Teacher : 5 Kids',
  },
  {
    id: 'level_2',
    name: 'Level 2',
    roomName: 'Faith Studio (Room 103)',
    ageRange: 'Ages 6-7',
    minAge: 6,
    maxAge: 7,
    color: '#EAB308', // Yellow
    headerGradient: 'from-[#FACC15] to-[#EAB308]',
    badgeBg: 'bg-amber-400/20 text-amber-800 dark:text-amber-300 border-amber-500/30',
    solidBg: 'bg-[#EAB308] text-slate-950 font-black',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-600 dark:text-amber-400',
    description: 'Primary early readers, memory verse games, and foundational Bible truths.',
    ratioGuidelines: '1 Teacher : 6 Kids',
  },
  {
    id: 'level_3',
    name: 'Level 3',
    roomName: 'Courage Lab (Room 201)',
    ageRange: 'Ages 8-9',
    minAge: 8,
    maxAge: 9,
    color: '#EF4444', // Red
    headerGradient: 'from-[#EF4444] to-[#DC2626]',
    badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    solidBg: 'bg-[#EF4444] text-white',
    borderColor: 'border-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    description: 'Junior Bible explorers, dynamic object lessons, and small group huddles.',
    ratioGuidelines: '1 Teacher : 8 Kids',
  },
  {
    id: 'level_4',
    name: 'Level 4',
    roomName: 'Pioneer Room (Room 202)',
    ageRange: 'Ages 10-12',
    minAge: 10,
    maxAge: 12,
    color: '#10B981', // Green
    headerGradient: 'from-[#10B981] to-[#059669]',
    badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    solidBg: 'bg-[#10B981] text-white',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'Pre-teens leadership development, deep scripture discussions, and worship team.',
    ratioGuidelines: '1 Teacher : 10 Kids',
  },
];

export type VolunteerRole =
  | 'large_group_host'
  | 'small_group_teacher'
  | 'marshall'
  | 'junior_life_shaper'
  | 'registration'
  | 'coordinator'
  | 'lead_teacher'
  | 'assistant_teacher'
  | 'praise_worship'
  | 'usher_greeter';

export const VOLUNTEER_ROLES: { id: VolunteerRole; label: string }[] = [
  { id: 'large_group_host', label: 'Large Group/Host' },
  { id: 'small_group_teacher', label: 'Small Group Teacher' },
  { id: 'marshall', label: 'Marshall' },
  { id: 'junior_life_shaper', label: 'Junior Life Shaper' },
  { id: 'registration', label: 'Registration' },
];

export const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'large_group_host':
    case 'coordinator':
      return 'Large Group/Host';
    case 'small_group_teacher':
    case 'lead_teacher':
    case 'assistant_teacher':
      return 'Small Group Teacher';
    case 'marshall':
    case 'usher_greeter':
      return 'Marshall';
    case 'junior_life_shaper':
    case 'praise_worship':
      return 'Junior Life Shaper';
    case 'registration':
      return 'Registration';
    default:
      return role.replace(/_/g, ' ');
  }
};

export type LifeshaperCategory = 'junior_lifeshaper' | 'lifeshaper';

export interface Volunteer {
  id: string; // e.g. "LS-01"
  name: string;
  email: string;
  phone: string;
  role: VolunteerRole;
  category?: LifeshaperCategory; // 'junior_lifeshaper' (13-17) or 'lifeshaper' (18+)
  dgroupLeaderName?: string;
  dgroupLeaderPhone?: string;
  isMinistryCoordinator?: boolean;
  avatarUrl: string;
  birthDate?: string; // YYYY-MM-DD for birthday notifications
  assignedLevel: LevelId | 'all' | 'unassigned';
  checkedInForSunday?: boolean;
  checkInTime?: string;
  status: 'active' | 'substitute' | 'on_leave';
}

export interface LiveNotification {
  id: string;
  type: 'kid_checkin' | 'kid_checkout' | 'lifeshaper_checkin' | 'birthday' | 'system';
  title: string;
  message: string;
  timestamp: string; // readable e.g. "08:45 AM"
  date: string; // YYYY-MM-DD
  levelId?: LevelId;
  read: boolean;
}

export interface KidMember {
  id: string; // e.g. "NXK-101"
  name: string;
  nickname?: string;
  gender: 'boy' | 'girl';
  birthDate: string; // YYYY-MM-DD
  birthYear: number;
  calculatedLevelId: LevelId;
  parentName: string;
  parentPhone: string;
  parentDGroupLeader?: string; // Name of DGroup Leader of Parent
  parentDGroupLeaderContact?: string; // Contact Number of DGroup Leader
  emergencyContact?: string;
  allergiesNotes?: string;
  avatarUrl: string;
  securityCode: string; // e.g. "NXT-382"
  isFirstTimer?: boolean;
  status: 'active' | 'inactive';
}

export interface SundayAttendanceRecord {
  id: string;
  kidId: string;
  sundayDate: string; // YYYY-MM-DD
  serviceName: string; // e.g. "1st Service - 9:00 AM"
  levelId: LevelId;
  status: 'present' | 'absent' | 'excused';
  checkInTime?: string;
  checkOutTime?: string;
  securityCode: string;
  checkedInBy?: string;
  pickedUpBy?: string;
  notes?: string;
  timestamp: number;
}

export interface VolunteerSundayAssignment {
  volunteerId: string;
  levelId: LevelId | 'all';
  serviceName: string;
  role: VolunteerRole;
  checkedIn: boolean;
  checkInTime?: string;
}

export interface SundayServiceSession {
  id: string;
  name: string; // e.g. "1st Service (8:30 AM - 10:30 AM)"
  time: string;
  coordinatorId: string;
}

export interface SystemSettings {
  churchName: string;
  ministryName: string;
  campusBranch: string;
  currentMinistryYear: number;
  soundEnabled: boolean;
  securityTagPrefix: string;
  requireParentPickupMatch: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Calculates Level placement strictly based on Birth Year,
 * as required by NXTGEN Kids Church policies.
 */
export function getLevelByBirthYear(birthYear: number, ministryYear = 2026): LevelId {
  const ageByYear = ministryYear - birthYear;

  if (ageByYear <= 3) {
    return 'aquarium';
  } else if (ageByYear <= 5) {
    return 'level_1';
  } else if (ageByYear <= 7) {
    return 'level_2';
  } else if (ageByYear <= 9) {
    return 'level_3';
  } else {
    return 'level_4';
  }
}

export function getLevelDetails(levelId: LevelId): LevelDefinition {
  return NXTGEN_LEVELS.find((l) => l.id === levelId) || NXTGEN_LEVELS[0];
}
