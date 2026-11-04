import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  KidMember,
  Volunteer,
  SundayAttendanceRecord,
  SystemSettings,
  SundayServiceSession,
  LevelId,
  VolunteerRole,
  getLevelByBirthYear,
  LiveNotification,
} from '../types/attendance';
import {
  initialKids,
  initialVolunteers,
  initialSettings,
  initialSundayServices,
  generateInitialSundayRecords,
} from '../utils/initialData';
import { sound } from '../utils/audio';

export interface CheckInResult {
  success: boolean;
  message: string;
  kid?: KidMember;
  record?: SundayAttendanceRecord;
  actionType?: 'checkin' | 'checkout' | 'duplicate' | 'error';
  timestamp?: string;
  securityCode?: string;
}

interface AttendanceContextType {
  kids: KidMember[];
  volunteers: Volunteer[];
  sundayServices: SundayServiceSession[];
  settings: SystemSettings;
  records: SundayAttendanceRecord[];
  notifications: LiveNotification[];
  unreadNotificationCount: number;
  selectedSunday: string;
  activeService: string;
  selectedLevel: LevelId | 'all';
  recentKioskScans: CheckInResult[];
  setSelectedSunday: (date: string) => void;
  setActiveService: (service: string) => void;
  setSelectedLevel: (level: LevelId | 'all') => void;
  checkInKid: (identifier: string, serviceName?: string) => CheckInResult;
  checkOutKid: (kidId: string, claimSecurityCode?: string) => CheckInResult;
  checkInVolunteer: (volunteerId: string) => void;
  assignVolunteer: (volunteerId: string, levelId: LevelId | 'all', role?: VolunteerRole) => void;
  addNotification: (
    item: Omit<LiveNotification, 'id' | 'read' | 'timestamp' | 'date'> & {
      timestamp?: string;
      date?: string;
    }
  ) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  updateKidStatus: (
    kidId: string,
    sundayDate: string,
    serviceName: string,
    status: 'present' | 'absent' | 'excused',
    notes?: string
  ) => void;
  batchMarkLevel: (levelId: LevelId, sundayDate: string, serviceName: string, status: 'present' | 'absent') => void;
  addKid: (kid: Omit<KidMember, 'calculatedLevelId' | 'securityCode'> & { calculatedLevelId?: LevelId; securityCode?: string }) => void;
  updateKid: (kid: KidMember) => void;
  deleteKid: (id: string) => void;
  addVolunteer: (volunteer: Volunteer) => void;
  updateVolunteer: (volunteer: Volunteer) => void;
  deleteVolunteer: (id: string) => void;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  resetToDefaults: () => void;
  exportJSON: () => void;
  importJSON: (jsonString: string) => boolean;
}

const STORAGE_KEYS = {
  KIDS: 'nxtgen_kids_v2',
  VOLUNTEERS: 'nxtgen_volunteers_v2',
  RECORDS: 'nxtgen_records_v2',
  SETTINGS: 'nxtgen_settings_v2',
  SERVICES: 'nxtgen_services_v2',
  NOTIFICATIONS: 'nxtgen_notifications_v2',
};

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedSunday, setSelectedSunday] = useState<string>(getTodayStr());

  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [sundayServices, setSundayServices] = useState<SundayServiceSession[]>(() => {
    return initialSundayServices;
  });

  const [activeService, setActiveService] = useState<string>('9:00 AM Sunday Service');

  const [selectedLevel, setSelectedLevel] = useState<LevelId | 'all'>('all');

  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOLUNTEERS);
      if (saved) {
        const parsed: Volunteer[] = JSON.parse(saved);
        return parsed.map((v) => ({
          ...v,
          id: v.id.startsWith('VOL-') ? v.id.replace('VOL-', 'LS-') : v.id,
          name: v.name.replace(/^Pastor\s+Arjay/i, 'Arjay'),
        }));
      }
      return initialVolunteers;
    } catch {
      return initialVolunteers;
    }
  });

  const [kids, setKids] = useState<KidMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KIDS);
      if (saved) {
        const parsed: KidMember[] = JSON.parse(saved);
        return parsed.map((k) => ({
          ...k,
          securityCode: k.securityCode.startsWith('NX-') ? k.securityCode.replace('NX-', 'NXT-') : k.securityCode,
          parentName: k.parentName.replace(/^Pastor\s+Arjay/i, 'Arjay'),
        }));
      }
      return initialKids;
    } catch {
      return initialKids;
    }
  });

  const [records, setRecords] = useState<SundayAttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (saved) {
        const parsed: SundayAttendanceRecord[] = JSON.parse(saved);
        return parsed.map((r) => ({
          ...r,
          serviceName: '9:00 AM Sunday Service',
          securityCode: r.securityCode.startsWith('NX-') ? r.securityCode.replace('NX-', 'NXT-') : r.securityCode,
          checkedInBy: r.checkedInBy?.replace(/^Pastor\s+Arjay/i, 'Arjay'),
        }));
      }
      return generateInitialSundayRecords();
    } catch {
      return generateInitialSundayRecords();
    }
  });

  const [notifications, setNotifications] = useState<LiveNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'notif-init-1',
        type: 'system',
        title: 'NXTGEN Roxas Attendance System Active',
        message: 'Sunday service attendance monitoring initialized for all 5 age groups.',
        timestamp: '07:30 AM',
        date: getTodayStr(),
        read: false,
      },
      {
        id: 'notif-init-2',
        type: 'lifeshaper_checkin',
        title: 'Lifeshaper Checked In',
        message: 'Pastor Arjay Aguirre (Ministry Coordinator) checked in for Sunday service.',
        timestamp: '07:30 AM',
        date: getTodayStr(),
        read: false,
      },
      {
        id: 'notif-init-3',
        type: 'lifeshaper_checkin',
        title: 'Lifeshaper Checked In',
        message: 'Teacher Bea Clarisse Mendoza (Lifeshaper) checked in to Aquarium Room.',
        timestamp: '07:45 AM',
        date: getTodayStr(),
        read: false,
      },
    ];
  });

  const [recentKioskScans, setRecentKioskScans] = useState<CheckInResult[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KIDS, JSON.stringify(kids));
  }, [kids]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(volunteers));
  }, [volunteers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(sundayServices));
  }, [sundayServices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const getCurrentTimeFormatted = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const addNotification = (
    item: Omit<LiveNotification, 'id' | 'read' | 'timestamp' | 'date'> & {
      timestamp?: string;
      date?: string;
    }
  ) => {
    const newNotif: LiveNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: item.type,
      title: item.title,
      message: item.message,
      timestamp: item.timestamp || getCurrentTimeFormatted(),
      date: item.date || selectedSunday,
      levelId: item.levelId,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
    if (settings.soundEnabled) {
      sound.playNotification();
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  // Check In Kid
  const checkInKid = (identifier: string, serviceName = activeService): CheckInResult => {
    const cleanId = identifier.trim().toUpperCase();
    if (!cleanId) {
      return { success: false, message: 'Please enter a valid Child Name, ID or Security Code', actionType: 'error' };
    }

    const kid = kids.find(
      (k) =>
        k.id.toUpperCase() === cleanId ||
        k.securityCode.toUpperCase() === cleanId ||
        k.name.toUpperCase().includes(cleanId) ||
        (k.nickname && k.nickname.toUpperCase() === cleanId) ||
        k.parentPhone.includes(cleanId)
    );

    if (!kid) {
      if (settings.soundEnabled) sound.playError();
      const failResult: CheckInResult = {
        success: false,
        message: `Child record not found for "${identifier.trim()}". Please register at the desk.`,
        actionType: 'error',
        timestamp: getCurrentTimeFormatted(),
      };
      setRecentKioskScans((prev) => [failResult, ...prev.slice(0, 15)]);
      return failResult;
    }

    const today = selectedSunday;
    const timeStr = getCurrentTimeFormatted();

    // Check if already checked in today for this service
    const existingIndex = records.findIndex(
      (r) => r.kidId === kid.id && r.sundayDate === today && r.serviceName === serviceName
    );

    if (existingIndex >= 0) {
      const existing = records[existingIndex];
      if (existing.status === 'present' && !existing.checkOutTime) {
        if (settings.soundEnabled) sound.playWarning();
        const dupResult: CheckInResult = {
          success: true,
          message: `${kid.name} is already checked in for ${serviceName}! Security code: ${existing.securityCode}`,
          kid,
          record: existing,
          actionType: 'duplicate',
          timestamp: timeStr,
          securityCode: existing.securityCode,
        };
        setRecentKioskScans((prev) => [dupResult, ...prev.slice(0, 15)]);
        return dupResult;
      }
    }

    // New check-in
    const newRecord: SundayAttendanceRecord = {
      id: `att-${today}-${kid.id}-${Date.now().toString().slice(-4)}`,
      kidId: kid.id,
      sundayDate: today,
      serviceName,
      levelId: kid.calculatedLevelId,
      status: 'present',
      checkInTime: timeStr,
      securityCode: kid.securityCode,
      checkedInBy: kid.parentName,
      timestamp: Date.now(),
    };

    setRecords((prev) => [newRecord, ...prev]);

    // Dispatch automatic check-in notification
    addNotification({
      type: 'kid_checkin',
      title: 'Child Checked In',
      message: `${kid.name} checked in to ${kid.calculatedLevelId.replace('_', ' ').toUpperCase()} (${serviceName})`,
      levelId: kid.calculatedLevelId,
      timestamp: timeStr,
      date: today,
    });

    if (settings.soundEnabled) sound.playSuccess('checkin');

    try {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#29C5E8', '#FF6F00', '#ffffff'],
      });
    } catch {}

    const successResult: CheckInResult = {
      success: true,
      message: `Welcome to NXTGEN Kids Church, ${kid.name}! Checked into ${kid.calculatedLevelId.replace('_', ' ').toUpperCase()}`,
      kid,
      record: newRecord,
      actionType: 'checkin',
      timestamp: timeStr,
      securityCode: kid.securityCode,
    };

    setRecentKioskScans((prev) => [successResult, ...prev.slice(0, 15)]);
    return successResult;
  };

  // Check Out Kid (Parent pickup with claim tag security)
  const checkOutKid = (kidId: string, claimSecurityCode?: string): CheckInResult => {
    const kid = kids.find((k) => k.id === kidId);
    if (!kid) {
      return { success: false, message: 'Child not found', actionType: 'error' };
    }

    const today = selectedSunday;
    const timeStr = getCurrentTimeFormatted();

    const recordIndex = records.findIndex(
      (r) => r.kidId === kidId && r.sundayDate === today && r.serviceName === activeService
    );

    if (recordIndex === -1) {
      return { success: false, message: `${kid.name} has not been checked in today yet.`, actionType: 'error' };
    }

    const rec = records[recordIndex];

    if (settings.requireParentPickupMatch && claimSecurityCode) {
      if (claimSecurityCode.trim().toUpperCase() !== rec.securityCode.toUpperCase()) {
        if (settings.soundEnabled) sound.playError();
        return {
          success: false,
          message: `Security Claim Tag MISMATCH! Tag "${claimSecurityCode}" does not match child's security tag "${rec.securityCode}". Verification required.`,
          actionType: 'error',
        };
      }
    }

    const updated = {
      ...rec,
      checkOutTime: timeStr,
      pickedUpBy: kid.parentName,
      timestamp: Date.now(),
    };

    const nextRecords = [...records];
    nextRecords[recordIndex] = updated;
    setRecords(nextRecords);

    // Dispatch automatic check-out notification
    addNotification({
      type: 'kid_checkout',
      title: 'Child Checked Out / Picked Up',
      message: `${kid.name} safely picked up by ${kid.parentName} (Claim Tag verified)`,
      levelId: kid.calculatedLevelId,
      timestamp: timeStr,
      date: today,
    });

    if (settings.soundEnabled) sound.playPickUp();

    const result: CheckInResult = {
      success: true,
      message: `Safe Pickup verified! ${kid.name} has been released to parent/guardian.`,
      kid,
      record: updated,
      actionType: 'checkout',
      timestamp: timeStr,
      securityCode: rec.securityCode,
    };

    setRecentKioskScans((prev) => [result, ...prev.slice(0, 15)]);
    return result;
  };

  // Check In Volunteer for Sunday
  const checkInVolunteer = (volunteerId: string) => {
    const nowTime = getCurrentTimeFormatted();
    const targetVol = volunteers.find((v) => v.id === volunteerId);

    setVolunteers((prev) =>
      prev.map((v) => {
        if (v.id === volunteerId) {
          const nextState = !v.checkedInForSunday;
          return {
            ...v,
            checkedInForSunday: nextState,
            checkInTime: nextState ? nowTime : undefined,
          };
        }
        return v;
      })
    );

    if (targetVol && !targetVol.checkedInForSunday) {
      addNotification({
        type: 'lifeshaper_checkin',
        title: 'Lifeshaper Checked In',
        message: `${targetVol.name} (${targetVol.category === 'junior_lifeshaper' ? 'Junior Lifeshaper' : 'Lifeshaper'}) checked in for Sunday duty`,
        levelId: targetVol.assignedLevel !== 'all' && targetVol.assignedLevel !== 'unassigned' ? targetVol.assignedLevel : undefined,
        timestamp: nowTime,
      });
    }

    if (settings.soundEnabled) sound.playLifeshaperCheckIn();
  };

  // Assign Volunteer to a room / level
  const assignVolunteer = (volunteerId: string, levelId: LevelId | 'all', role?: VolunteerRole) => {
    setVolunteers((prev) =>
      prev.map((v) => {
        if (v.id === volunteerId) {
          return {
            ...v,
            assignedLevel: levelId,
            role: role || v.role,
          };
        }
        return v;
      })
    );
  };

  // Update specific kid status
  const updateKidStatus = (
    kidId: string,
    sundayDate: string,
    serviceName: string,
    status: 'present' | 'absent' | 'excused',
    notes?: string
  ) => {
    const kid = kids.find((k) => k.id === kidId);
    if (!kid) return;

    const timeStr = getCurrentTimeFormatted();
    const existingIndex = records.findIndex(
      (r) => r.kidId === kidId && r.sundayDate === sundayDate && r.serviceName === serviceName
    );

    if (existingIndex >= 0) {
      const nextRecords = [...records];
      nextRecords[existingIndex] = {
        ...nextRecords[existingIndex],
        status,
        checkInTime: status === 'present' ? nextRecords[existingIndex].checkInTime || timeStr : undefined,
        notes: notes !== undefined ? notes : nextRecords[existingIndex].notes,
        timestamp: Date.now(),
      };
      setRecords(nextRecords);
    } else {
      const newRec: SundayAttendanceRecord = {
        id: `att-${sundayDate}-${kidId}-${Date.now().toString().slice(-4)}`,
        kidId,
        sundayDate,
        serviceName,
        levelId: kid.calculatedLevelId,
        status,
        checkInTime: status === 'present' ? timeStr : undefined,
        securityCode: kid.securityCode,
        checkedInBy: 'Sunday Roster Desk',
        notes,
        timestamp: Date.now(),
      };
      setRecords((prev) => [newRec, ...prev]);
    }
  };

  // Batch mark kids in a level
  const batchMarkLevel = (
    levelId: LevelId,
    sundayDate: string,
    serviceName: string,
    status: 'present' | 'absent'
  ) => {
    const levelKids = kids.filter((k) => k.calculatedLevelId === levelId && k.status === 'active');
    const timeStr = getCurrentTimeFormatted();
    const updated = [...records];

    levelKids.forEach((kid) => {
      const idx = updated.findIndex(
        (r) => r.kidId === kid.id && r.sundayDate === sundayDate && r.serviceName === serviceName
      );
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          status,
          checkInTime: status === 'present' ? updated[idx].checkInTime || timeStr : undefined,
          timestamp: Date.now(),
        };
      } else {
        updated.push({
          id: `att-${sundayDate}-${kid.id}-${Date.now().toString().slice(-4)}`,
          kidId: kid.id,
          sundayDate,
          serviceName,
          levelId,
          status,
          checkInTime: status === 'present' ? timeStr : undefined,
          securityCode: kid.securityCode,
          checkedInBy: 'Batch Desk Action',
          timestamp: Date.now(),
        });
      }
    });

    setRecords(updated);
  };

  // Add Kid with automatic birth-year level assignment
  const addKid = (kidInput: Omit<KidMember, 'calculatedLevelId' | 'securityCode'> & { calculatedLevelId?: LevelId; securityCode?: string }) => {
    const birthYear = kidInput.birthYear || (kidInput.birthDate ? new Date(kidInput.birthDate).getFullYear() : 2020);
    const calculatedLevelId = kidInput.calculatedLevelId || getLevelByBirthYear(birthYear, settings.currentMinistryYear);
    const securityCode = kidInput.securityCode || `${settings.securityTagPrefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newKid: KidMember = {
      ...kidInput,
      birthYear,
      calculatedLevelId,
      securityCode,
      status: kidInput.status || 'active',
    };

    setKids((prev) => [newKid, ...prev]);
  };

  const updateKid = (kid: KidMember) => {
    // Recompute level if birthYear was modified
    const calculatedLevelId = getLevelByBirthYear(kid.birthYear, settings.currentMinistryYear);
    const updated = { ...kid, calculatedLevelId };
    setKids((prev) => prev.map((k) => (k.id === kid.id ? updated : k)));
  };

  const deleteKid = (id: string) => {
    setKids((prev) => prev.filter((k) => k.id !== id));
    setRecords((prev) => prev.filter((r) => r.kidId !== id));
  };

  const addVolunteer = (vol: Volunteer) => setVolunteers((prev) => [vol, ...prev]);
  const updateVolunteer = (vol: Volunteer) =>
    setVolunteers((prev) => prev.map((v) => (v.id === vol.id ? vol : v)));
  const deleteVolunteer = (id: string) =>
    setVolunteers((prev) => prev.filter((v) => v.id !== id));

  const updateSettings = (patch: Partial<SystemSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  const resetToDefaults = () => {
    setKids(initialKids);
    setVolunteers(initialVolunteers);
    setSettings(initialSettings);
    setSundayServices(initialSundayServices);
    setRecords(generateInitialSundayRecords());
    setRecentKioskScans([]);
    localStorage.clear();
  };

  const exportJSON = () => {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      ministry: 'NXTGEN Roxas Attendance Management System',
      settings,
      sundayServices,
      volunteers,
      kids,
      records,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nxtgen-roxas-backup-${getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.kids && parsed.volunteers && parsed.records) {
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.sundayServices) setSundayServices(parsed.sundayServices);
        setVolunteers(parsed.volunteers);
        setKids(parsed.kids);
        setRecords(parsed.records);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AttendanceContext.Provider
      value={{
        kids,
        volunteers,
        sundayServices,
        settings,
        records,
        notifications,
        unreadNotificationCount,
        selectedSunday,
        activeService,
        selectedLevel,
        recentKioskScans,
        setSelectedSunday,
        setActiveService,
        setSelectedLevel,
        checkInKid,
        checkOutKid,
        checkInVolunteer,
        assignVolunteer,
        addNotification,
        markAllNotificationsRead,
        clearNotifications,
        updateKidStatus,
        batchMarkLevel,
        addKid,
        updateKid,
        deleteKid,
        addVolunteer,
        updateVolunteer,
        deleteVolunteer,
        updateSettings,
        resetToDefaults,
        exportJSON,
        importJSON,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
