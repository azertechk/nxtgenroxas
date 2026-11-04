import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole, PRESET_ACCOUNTS } from '../types/auth';
import { getAccessToken, syncAccountsToGoogleSheet } from '../services/googleWorkspace';

export interface RegisterParams {
  name: string;
  emailOrUsername: string;
  password?: string;
  role?: UserRole;
  assignedRoom?: string;
  phone?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVolunteer: boolean;
  allAccounts: UserAccount[];
  pendingAccounts: UserAccount[];
  login: (emailOrUsername: string, password?: string) => { success: boolean; message: string; user?: UserAccount };
  register: (params: RegisterParams) => { success: boolean; message: string; user?: UserAccount };
  switchAccount: (accountId: string) => void;
  approveAccount: (accountId: string) => { success: boolean; message: string; user?: UserAccount };
  rejectAccount: (accountId: string) => { success: boolean; message: string };
  deleteAccount: (accountId: string) => void;
  updateCurrentUserAccount: (updated: Partial<UserAccount>) => { success: boolean; message: string };
  logout: () => void;
  canAccess: (feature: AppFeature) => boolean;
}

export type AppFeature =
  | 'checkin'           // Scanner / Kiosk Check-in & Pick-up
  | 'roster'            // 5 Levels Classroom Roster
  | 'volunteers_view'   // Volunteer Pool directory (view only)
  | 'volunteers_manage' // Adding/Editing/Deleting volunteers & roles (admin only)
  | 'reports'           // Sunday CSV exports & summary reports
  | 'kids_directory'    // Kids directory & name tag printing (admin only)
  | 'coordinator_hub'   // Real-time safety ratios & claim tag overrides (admin only)
  | 'settings';         // System settings & academic year backups (admin only)

const AUTH_STORAGE_KEY = 'nxtgen_auth_user_v1';
const REGISTERED_ACCOUNTS_KEY = 'nxtgen_registered_accounts_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registeredAccounts, setRegisteredAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const allAccounts = [...PRESET_ACCOUNTS, ...registeredAccounts];

  // Every time they open the website, currentUser starts as null unless in active session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      // Clear any legacy persistent login so log-in screen is always first on fresh website open
      localStorage.removeItem(AUTH_STORAGE_KEY);
      const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return null;
  });

  useEffect(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (currentUser) {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore storage error
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(registeredAccounts));
    } catch {
      // ignore
    }
  }, [registeredAccounts]);

  const login = (
    emailOrUsername: string,
    password?: string
  ): { success: boolean; message: string; user?: UserAccount } => {
    const trimmed = emailOrUsername.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, message: 'Please enter your email or username.' };
    }

    // Match by email, username, or id
    const match = allAccounts.find(
      (acc) =>
        acc.id.toLowerCase() === trimmed ||
        acc.email.toLowerCase() === trimmed ||
        acc.username?.toLowerCase() === trimmed
    );

    if (!match) {
      return {
        success: false,
        message: 'No account found with this email or username. Please click Register to create one.',
      };
    }

    // Check status for accounts awaiting admin confirmation
    if (match.status === 'pending') {
      return {
        success: false,
        message: 'Your Lifeshaper account is awaiting Admin confirmation. Admin Arjay Aguirre must confirm and approve your registration before you can log in.',
      };
    }
    if (match.status === 'rejected') {
      return {
        success: false,
        message: 'This account registration was declined by the administrator.',
      };
    }

    // Secure password verification
    if (!password || !password.trim()) {
      return {
        success: false,
        message: 'Please enter your account password.',
      };
    }

    if (match.password && match.password !== password) {
      return {
        success: false,
        message: 'Incorrect password. Please verify your credentials and try again.',
      };
    }

    setCurrentUser(match);
    return { success: true, message: `Welcome back, ${match.name}!`, user: match };
  };

  const register = (
    params: RegisterParams
  ): { success: boolean; message: string; user?: UserAccount } => {
    const cleanName = params.name.trim();
    const cleanInput = params.emailOrUsername.trim().toLowerCase();

    if (!cleanName) {
      return { success: false, message: 'Please enter your full name.' };
    }
    if (!cleanInput) {
      return { success: false, message: 'Please enter an email or username.' };
    }

    // Check if user with that email or username already exists
    const existing = allAccounts.find(
      (acc) =>
        acc.email.toLowerCase() === cleanInput ||
        acc.username?.toLowerCase() === cleanInput
    );

    if (existing) {
      return {
        success: false,
        message: 'An account with this email or username already exists. Please sign in.',
      };
    }

    const isEmail = cleanInput.includes('@');
    const username = isEmail ? cleanInput.split('@')[0] : cleanInput;
    const email = isEmail ? cleanInput : `${username}@nxtgen.church`;
    const role: UserRole = params.role || 'volunteer';
    const assignedRoom = params.assignedRoom || 'Level 1';
    const isVolunteerRole = role === 'volunteer';
    const status: 'approved' | 'pending' = isVolunteerRole ? 'pending' : 'approved';

    const newAccount: UserAccount = {
      id: `teacher-${Date.now()}`,
      name: cleanName,
      email,
      username,
      password: params.password || 'password123',
      role,
      status,
      avatarUrl:
        params.avatarUrl ||
        (role === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'),
      title:
        role === 'admin'
          ? 'Church Administrator'
          : `Teacher - ${assignedRoom}`,
      assignedRoom,
      phone: params.phone?.trim() || '',
      registeredAt: new Date().toISOString().split('T')[0],
    };

    setRegisteredAccounts((prev) => {
      const updated = [newAccount, ...prev];
      // Sync to Google Sheets if connected
      getAccessToken().then((token) => {
        if (token) {
          syncAccountsToGoogleSheet(token, [...PRESET_ACCOUNTS, ...updated]).catch(() => {});
        }
      });
      return updated;
    });

    // If administrator, log in immediately.
    // If volunteer / lifeshaper, only admin can admit the account!
    if (!isVolunteerRole) {
      setCurrentUser(newAccount);
      return {
        success: true,
        message: `Admin account created successfully! Welcome to NXTGEN Roxas, ${cleanName}.`,
        user: newAccount,
      };
    }

    return {
      success: true,
      message: `Account registration submitted! Admin Arjay Aguirre will confirm and approve your Lifeshaper account first before you can log in.`,
      user: newAccount,
    };
  };

  const switchAccount = (accountId: string) => {
    const acc = allAccounts.find((a) => a.id === accountId);
    if (acc) {
      if (acc.status === 'pending') {
        alert('This account is awaiting Admin confirmation and cannot be used yet.');
        return;
      }
      setCurrentUser(acc);
    }
  };

  const approveAccount = (
    accountId: string
  ): { success: boolean; message: string; user?: UserAccount } => {
    let approvedUser: UserAccount | undefined;
    setRegisteredAccounts((prev) => {
      const updated = prev.map((acc) => {
        if (acc.id === accountId) {
          approvedUser = { ...acc, status: 'approved' as const };
          return approvedUser;
        }
        return acc;
      });

      // Sync confirmed account to Google Sheets
      getAccessToken().then((token) => {
        if (token) {
          syncAccountsToGoogleSheet(token, [...PRESET_ACCOUNTS, ...updated]).catch(() => {});
        }
      });

      return updated;
    });

    if (approvedUser) {
      return {
        success: true,
        message: `Account for ${(approvedUser as UserAccount).name} has been confirmed and approved! They can now log in.`,
        user: approvedUser,
      };
    }
    return { success: false, message: 'Account not found.' };
  };

  const rejectAccount = (accountId: string): { success: boolean; message: string } => {
    setRegisteredAccounts((prev) => {
      return prev.map((acc) => {
        if (acc.id === accountId) {
          return { ...acc, status: 'rejected' };
        }
        return acc;
      });
    });
    return { success: true, message: 'Lifeshaper account request was declined.' };
  };

  const deleteAccount = (accountId: string) => {
    setRegisteredAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
  };

  const updateCurrentUserAccount = (
    updated: Partial<UserAccount>
  ): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'No user is currently logged in.' };
    }

    const modified: UserAccount = {
      ...currentUser,
      ...updated,
    };

    setCurrentUser(modified);

    // If it's a registered account or preset account, update in registered list or persistence
    setRegisteredAccounts((prev) => {
      const idx = prev.findIndex((a) => a.id === modified.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = modified;
        return copy;
      }
      return [modified, ...prev];
    });

    return { success: true, message: 'Account updated successfully!' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isVolunteer = currentUser?.role === 'volunteer';

  const canAccess = (feature: AppFeature): boolean => {
    if (!currentUser) return false;

    // Admin has full access to every part of the system
    if (currentUser.role === 'admin') return true;

    // Teacher/Volunteer permissions:
    // "The available function for the teacher/volunteer are check-in and parent pick-up, Roster, Volunteers view only and reports like exporting."
    switch (feature) {
      case 'checkin':
      case 'roster':
      case 'volunteers_view':
      case 'reports':
        return true;
      case 'volunteers_manage':
      case 'kids_directory':
      case 'coordinator_hub':
      case 'settings':
      default:
        return false;
    }
  };

  const pendingAccounts = registeredAccounts.filter((a) => a.status === 'pending');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isAdmin,
        isVolunteer,
        allAccounts,
        pendingAccounts,
        login,
        register,
        switchAccount,
        approveAccount,
        rejectAccount,
        deleteAccount,
        updateCurrentUserAccount,
        logout,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
