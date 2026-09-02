import { Reservation, AuditLog } from '../types';

export const SPREADSHEET_ID = '1UDi8MePHWE9QF060jg1mePwRspjkm-5JGpUCypAajD0';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

const SHEET_NAME = 'Sheet1';

export const SHEET_HEADERS = [
  '예약접수번호',
  'PMS예약번호',
  '예약상태',
  '제휴사명',
  '제휴사코드',
  '패키지명',
  '객실타입명',
  '체크인',
  '체크아웃',
  '박수',
  '객실수',
  '최종결제금액(원)',
  '원래금액(원)',
  '할인금액(원)',
  '예약자명',
  '연락처',
  '이메일',
  '특이사항',
  '신청일시',
  '확정/취소일시',
  '취소위약금(원)',
  '취소사유',
];

// Helper to convert Reservation object to row array
export const reservationToRow = (res: Reservation): (string | number)[] => {
  const statusKorean =
    res.status === 'confirmed'
      ? '예약확정'
      : res.status === 'cancelled'
      ? '예약취소'
      : '확정대기';

  const actionDate = res.confirmedAt || res.cancelledAt || '';

  return [
    res.id,
    res.pmsReservationNo || '',
    statusKorean,
    res.partnerName || '',
    res.partnerCode || '',
    res.packageName || '',
    res.roomTypeName || '',
    res.checkIn || '',
    res.checkOut || '',
    res.nights || 1,
    res.roomCount || 1,
    res.totalPrice || 0,
    res.originalTotalPrice || 0,
    res.discountAmount || 0,
    res.bookerName || '',
    res.bookerPhone || '',
    res.bookerEmail || '',
    res.specialRequests || '',
    res.createdAt || '',
    actionDate,
    res.penaltyAmount || 0,
    res.cancelReason || '',
  ];
};

// --- Google Sheets API Functions ---

export const getFirstSheetName = async (accessToken: string): Promise<string> => {
  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties.title`;
    const res = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.sheets && data.sheets.length > 0 && data.sheets[0].properties?.title) {
        return data.sheets[0].properties.title;
      }
    }
  } catch {
    // Suppress error details to prevent leaking metadata
  }
  return 'Sheet1';
};

/**
 * Initializes Spreadsheet Headers if empty
 */
export const ensureSpreadsheetStructure = async (accessToken: string, sheetName?: string): Promise<{ ok: boolean; sheetTitle: string }> => {
  try {
    const actualSheetName = sheetName || (await getFirstSheetName(accessToken));
    const encodedSheetName = encodeURIComponent(actualSheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedSheetName}!A1:V1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return { ok: false, sheetTitle: actualSheetName };
    }

    const data = await res.json();
    const hasHeaders = data.values && data.values.length > 0 && data.values[0].length > 0;

    if (!hasHeaders) {
      // Put header row
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedSheetName}!A1:V1?valueInputOption=USER_ENTERED`;
      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [SHEET_HEADERS],
        }),
      });
      return { ok: updateRes.ok, sheetTitle: actualSheetName };
    }
    return { ok: true, sheetTitle: actualSheetName };
  } catch {
    return { ok: false, sheetTitle: 'Sheet1' };
  }
};

/**
 * Sync all reservations to Google Sheet (overwrites/updates existing rows)
 */
export const syncAllReservationsToSheet = async (
  accessToken: string,
  reservations: Reservation[]
): Promise<boolean> => {
  try {
    const { sheetTitle } = await ensureSpreadsheetStructure(accessToken);
    const encodedSheetName = encodeURIComponent(sheetTitle);

    const rows = [SHEET_HEADERS, ...reservations.map(reservationToRow)];

    // Clear sheet first if needed to remove stale trailing rows
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedSheetName}!A1:V500:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedSheetName}!A1:V${rows.length}?valueInputOption=USER_ENTERED`;
    const res = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    });

    if (!res.ok) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Sync a single reservation to Google Sheet
 */
export const syncSingleReservationToSheet = async (
  accessToken: string,
  reservation: Reservation,
  allReservations: Reservation[]
): Promise<boolean> => {
  // Simple & safest way: batch sync full current reservations list to guarantee order and consistency
  const updatedList = [
    reservation,
    ...allReservations.filter((r) => r.id !== reservation.id),
  ];
  return syncAllReservationsToSheet(accessToken, updatedList);
};


// --- Google Drive Folder & File Logging Functions ---

let cachedResortFolderId: string | null = null;

/**
 * Ensures Google Drive folder hierarchy: Root > AI 스튜디오 > 제휴사 예약창
 */
export const ensureDriveFolderHierarchy = async (accessToken: string): Promise<string | null> => {
  if (cachedResortFolderId) return cachedResortFolderId;

  try {
    // 1. Search or create 'AI 스튜디오' folder
    const aiFolderSearchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      "name='AI 스튜디오' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false"
    )}`;
    
    const aiRes = await fetch(aiFolderSearchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const aiData = await aiRes.json();

    let aiStudioFolderId: string;
    if (aiData.files && aiData.files.length > 0) {
      aiStudioFolderId = aiData.files[0].id;
    } else {
      // Create 'AI 스튜디오'
      const createAiRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'AI 스튜디오',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root'],
        }),
      });
      const newAiFolder = await createAiRes.json();
      aiStudioFolderId = newAiFolder.id;
    }

    // 2. Search or create '제휴사 예약창' subfolder inside 'AI 스튜디오'
    const resortSearchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='제휴사 예약창' and mimeType='application/vnd.google-apps.folder' and '${aiStudioFolderId}' in parents and trashed=false`
    )}`;

    const resortRes = await fetch(resortSearchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const resortData = await resortRes.json();

    if (resortData.files && resortData.files.length > 0) {
      cachedResortFolderId = resortData.files[0].id;
    } else {
      const createResortRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '제휴사 예약창',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [aiStudioFolderId],
        }),
      });
      const newResortFolder = await createResortRes.json();
      cachedResortFolderId = newResortFolder.id;
    }

    return cachedResortFolderId;
  } catch {
    return null;
  }
};

/**
 * Appends or saves audit log to Drive file '작업이력_기록.json' in 'AI 스튜디오/제휴사 예약창'
 */
export const saveAuditLogToDrive = async (
  accessToken: string,
  newLog: AuditLog,
  existingLogs: AuditLog[]
): Promise<boolean> => {
  try {
    const folderId = await ensureDriveFolderHierarchy(accessToken);
    if (!folderId) return false;

    const fullLogList = [newLog, ...existingLogs.filter((l) => l.id !== newLog.id)];

    // Check if '작업이력_기록.json' exists
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='작업이력_기록.json' and '${folderId}' in parents and trashed=false`
    )}`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const searchData = await searchRes.json();

    const jsonBody = JSON.stringify(fullLogList, null, 2);

    if (searchData.files && searchData.files.length > 0) {
      const fileId = searchData.files[0].id;
      // Update existing file content
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: jsonBody,
      });
      return updateRes.ok;
    } else {
      // Create new file with multipart upload
      const metadata = {
        name: '작업이력_기록.json',
        parents: [folderId],
        mimeType: 'application/json',
      };

      const boundary = 'foo_bar_baz_boundary';
      const multipartBody =
        `--${boundary}\r\n` +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\n` +
        'Content-Type: application/json\r\n\r\n' +
        jsonBody +
        `\r\n--${boundary}--`;

      const createRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );
      return createRes.ok;
    }
  } catch {
    return false;
  }
};

/**
 * Fetch Audit History from Google Drive folder 'AI 스튜디오/제휴사 예약창/작업이력_기록.json'
 */
export const fetchAuditHistoryFromDrive = async (
  accessToken: string
): Promise<AuditLog[] | null> => {
  try {
    const folderId = await ensureDriveFolderHierarchy(accessToken);
    if (!folderId) return null;

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='작업이력_기록.json' and '${folderId}' in parents and trashed=false`
    )}`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      const fileId = searchData.files[0].id;
      const getFileUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const fileRes = await fetch(getFileUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (fileRes.ok) {
        const logs: AuditLog[] = await fileRes.json();
        return logs;
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Saves system full backup state to Google Drive '시스템설정_백업.json'
 */
export const saveSystemBackupToDrive = async (
  accessToken: string,
  stateToSave: Record<string, unknown>
): Promise<boolean> => {
  try {
    const folderId = await ensureDriveFolderHierarchy(accessToken);
    if (!folderId) return false;

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='시스템설정_백업.json' and '${folderId}' in parents and trashed=false`
    )}`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const searchData = await searchRes.json();

    const jsonBody = JSON.stringify(stateToSave, null, 2);

    if (searchData.files && searchData.files.length > 0) {
      const fileId = searchData.files[0].id;
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: jsonBody,
      });
      return updateRes.ok;
    } else {
      const metadata = {
        name: '시스템설정_백업.json',
        parents: [folderId],
        mimeType: 'application/json',
      };

      const boundary = 'foo_bar_baz_backup';
      const multipartBody =
        `--${boundary}\r\n` +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\n` +
        'Content-Type: application/json\r\n\r\n' +
        jsonBody +
        `\r\n--${boundary}--`;

      const createRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );
      return createRes.ok;
    }
  } catch {
    return false;
  }
};

/**
 * Load system backup from Google Drive
 */
export const loadSystemBackupFromDrive = async (
  accessToken: string
): Promise<Record<string, unknown> | null> => {
  try {
    const folderId = await ensureDriveFolderHierarchy(accessToken);
    if (!folderId) return null;

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='시스템설정_백업.json' and '${folderId}' in parents and trashed=false`
    )}`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      const fileId = searchData.files[0].id;
      const getFileUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const fileRes = await fetch(getFileUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (fileRes.ok) {
        return await fileRes.json();
      }
    }
    return null;
  } catch {
    return null;
  }
};
