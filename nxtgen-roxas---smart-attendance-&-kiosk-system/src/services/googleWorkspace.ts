import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { KidMember, Volunteer, SundayAttendanceRecord } from '../types/attendance';
import { UserAccount } from '../types/auth';

// Initialize Firebase App singleton safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Workspace Scopes
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// In-memory token cache (never stored in localStorage for security)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/* ========================================================
   GOOGLE DRIVE BACKUP & IMAGE SYNC
======================================================== */

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

/**
 * Ensures or creates a dedicated folder in Google Drive for NXTGEN Roxas
 */
export async function getOrCreateDriveFolder(token: string, folderName = 'NXTGEN Roxas Attendance Backups'): Promise<string> {
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
  const listRes = await fetch(`${DRIVE_FILES_URL}?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    throw new Error(`Failed to query Google Drive: ${listRes.statusText}`);
  }

  const listData = await listRes.json();
  if (listData.files && listData.files.length > 0) {
    return listData.files[0].id;
  }

  // Create folder
  const createRes = await fetch(DRIVE_FILES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Uploads a JSON database backup snapshot into Google Drive
 */
export async function uploadBackupToDrive(
  token: string,
  backupPayload: Record<string, unknown>,
  customFileName?: string
): Promise<{ fileId: string; fileName: string; webViewLink?: string }> {
  const folderId = await getOrCreateDriveFolder(token);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = customFileName || `nxtgen-roxas-backup-${timestamp}.json`;

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
  };

  const fileContent = JSON.stringify(backupPayload, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    throw new Error(`Drive backup upload failed: ${res.statusText}`);
  }

  const file = await res.json();
  return { fileId: file.id, fileName, webViewLink: file.webViewLink };
}

/**
 * Uploads a profile or badge photo (Base64 dataUrl) to Google Drive in folder 'NXTGEN Photos'
 */
export async function uploadPhotoToGoogleDrive(
  token: string,
  dataUrl: string,
  fileName: string
): Promise<{ fileId: string; webViewLink?: string }> {
  const folderId = await getOrCreateDriveFolder(token, 'NXTGEN Photos');

  // Extract base64 payload and mime type
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  const mimeType = matches ? matches[1] : 'image/jpeg';
  const base64Data = matches ? matches[2] : dataUrl;

  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    throw new Error(`Google Drive photo upload failed: ${res.statusText}`);
  }

  const file = await res.json();
  return { fileId: file.id, webViewLink: file.webViewLink };
}

/* ========================================================
   GOOGLE SHEETS ATTENDANCE & DATA SYNC
======================================================== */

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Finds or creates the Google Spreadsheet for NXTGEN Roxas
 */
export async function getOrCreateAttendanceSpreadsheet(token: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const sheetTitle = 'NXTGEN Roxas - Sunday Attendance & Master Registry';
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.spreadsheet' and name='${sheetTitle}' and trashed=false`);
  const listRes = await fetch(`${DRIVE_FILES_URL}?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (listRes.ok) {
    const listData = await listRes.json();
    if (listData.files && listData.files.length > 0) {
      return {
        spreadsheetId: listData.files[0].id,
        spreadsheetUrl: listData.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${listData.files[0].id}/edit`,
      };
    }
  }

  // Create new spreadsheet with 4 tabs: Attendance, Kids Directory, Lifeshapers, User Accounts
  const createRes = await fetch(SHEETS_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: sheetTitle },
      sheets: [
        { properties: { title: 'Attendance Log' } },
        { properties: { title: 'Kids Registry' } },
        { properties: { title: 'Lifeshapers Roster' } },
        { properties: { title: 'User Accounts' } },
      ],
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Sheet: ${createRes.statusText}`);
  }

  const sheetData = await createRes.json();
  return {
    spreadsheetId: sheetData.spreadsheetId,
    spreadsheetUrl: sheetData.spreadsheetUrl,
  };
}

/**
 * Syncs Kids, Volunteers, and Attendance Records into the Google Sheet
 */
export async function syncDatabaseToGoogleSheet(
  token: string,
  kids: KidMember[],
  volunteers: Volunteer[],
  records: SundayAttendanceRecord[],
  selectedSunday: string,
  activeService: string,
  accounts: UserAccount[] = []
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; rowCount: number }> {
  const { spreadsheetId, spreadsheetUrl } = await getOrCreateAttendanceSpreadsheet(token);

  // Tab 1: Attendance Log Values
  const attendanceHeaders = [
    'Sunday Date',
    'Service',
    'Child Name',
    'Security Tag',
    'Birth Year',
    'Calculated Level',
    'Attendance Status',
    'Check-In Time',
    'Check-Out Time',
    'Parent / Guardian',
    'Parent Contact',
    'Medical / Allergy Notes',
  ];

  const attendanceRows = records
    .filter((r) => r.sundayDate === selectedSunday && r.serviceName === activeService)
    .map((r) => {
      const kid = kids.find((k) => k.id === r.kidId);
      return [
        r.sundayDate,
        r.serviceName,
        kid ? kid.name : r.kidId,
        kid ? kid.securityCode : '-',
        kid ? kid.birthYear : '-',
        kid ? kid.calculatedLevelId : '-',
        r.status.toUpperCase(),
        r.checkInTime || '-',
        r.checkOutTime || '-',
        kid ? kid.parentName : '-',
        kid ? kid.parentPhone : '-',
        kid ? kid.allergiesNotes || 'None' : '-',
      ];
    });

  // Tab 2: Kids Registry Values
  const kidsHeaders = [
    'Child ID',
    'Full Name',
    'Nickname',
    'Birth Year',
    'Exact Birthdate',
    'Assigned Level',
    'Security Tag Code',
    'Parent Name',
    'Parent Phone',
    'Parent DGroup Leader',
    'DGroup Leader Phone',
    'Allergies / Special Care Notes',
    'Member Status',
  ];

  const kidsRows = kids.map((k) => [
    k.id,
    k.name,
    k.nickname || '',
    k.birthYear,
    k.birthDate || '',
    k.calculatedLevelId,
    k.securityCode,
    k.parentName,
    k.parentPhone,
    k.parentDGroupLeader || '',
    k.parentDGroupLeaderContact || '',
    k.allergiesNotes || '',
    k.status || 'active',
  ]);

  // Tab 3: Lifeshapers Roster Values
  const volHeaders = [
    'Lifeshaper ID',
    'Full Name',
    'Role',
    'Category',
    'Assigned Level / Room',
    'Phone',
    'Email',
    'DGroup Leader',
    'DGroup Leader Phone',
    'Checked In Today',
    'Arrival Time',
  ];

  const volRows = volunteers.map((v) => [
    v.id,
    v.name,
    v.role,
    v.category === 'junior_lifeshaper' ? 'Junior (13-17)' : 'Lifeshaper (18+)',
    v.assignedLevel,
    v.phone,
    v.email,
    v.dgroupLeaderName || '',
    v.dgroupLeaderPhone || '',
    v.checkedInForSunday ? 'YES' : 'NO',
    v.checkInTime || '-',
  ]);

  // Tab 4: User Accounts Values
  const accountHeaders = [
    'Account ID',
    'Full Name',
    'Username',
    'Email',
    'Role',
    'Status',
    'Assigned Room',
    'Phone',
    'Title / Designation',
    'Registration Date',
  ];

  const accountRows = accounts.map((acc) => [
    acc.id,
    acc.name,
    acc.username || '-',
    acc.email,
    acc.role.toUpperCase(),
    (acc.status || 'approved').toUpperCase(),
    acc.assignedRoom || 'Level 1',
    acc.phone || '-',
    acc.title || '-',
    acc.registeredAt || '-',
  ]);

  // Batch update spreadsheet values
  const updateRes = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Attendance Log!A1:L',
          values: [attendanceHeaders, ...attendanceRows],
        },
        {
          range: 'Kids Registry!A1:M',
          values: [kidsHeaders, ...kidsRows],
        },
        {
          range: 'Lifeshapers Roster!A1:K',
          values: [volHeaders, ...volRows],
        },
        {
          range: 'User Accounts!A1:J',
          values: [accountHeaders, ...accountRows],
        },
      ],
    }),
  });

  if (!updateRes.ok) {
    throw new Error(`Sheets update failed: ${updateRes.statusText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    rowCount: attendanceRows.length + kidsRows.length + volRows.length + accountRows.length,
  };
}

/**
 * Specifically syncs user accounts (registered Lifeshapers and Admins) to Google Sheets
 */
export async function syncAccountsToGoogleSheet(
  token: string,
  accounts: UserAccount[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; rowCount: number }> {
  const { spreadsheetId, spreadsheetUrl } = await getOrCreateAttendanceSpreadsheet(token);

  const accountHeaders = [
    'Account ID',
    'Full Name',
    'Username',
    'Email',
    'Role',
    'Status',
    'Assigned Room',
    'Phone',
    'Title / Designation',
    'Registration Date',
  ];

  const accountRows = accounts.map((acc) => [
    acc.id,
    acc.name,
    acc.username || '-',
    acc.email,
    acc.role.toUpperCase(),
    (acc.status || 'approved').toUpperCase(),
    acc.assignedRoom || 'Level 1',
    acc.phone || '-',
    acc.title || '-',
    acc.registeredAt || '-',
  ]);

  const updateRes = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'User Accounts!A1:J',
          values: [accountHeaders, ...accountRows],
        },
      ],
    }),
  });

  if (!updateRes.ok) {
    throw new Error(`Sheets accounts sync failed: ${updateRes.statusText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    rowCount: accountRows.length,
  };
}
