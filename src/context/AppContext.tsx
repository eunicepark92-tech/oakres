import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, googleSignOut, initAuthListener } from '../services/googleAuth';
import {
  saveFirebaseAppState,
  getFirebaseAppState,
  subscribeToFirebaseAppState,
} from '../services/firebaseDb';
import {
  syncAllReservationsToSheet,
  syncSingleReservationToSheet,
  saveAuditLogToDrive,
  fetchAuditHistoryFromDrive,
  saveSystemBackupToDrive,
} from '../services/googleDriveSheets';
import {
  Partner,
  Package,
  RoomType,
  CancellationRule,
  DailyRate,
  Reservation,
  AdminUser,
  NotificationLog,
  Settlement,
  MediaAsset,
  SeasonPeriod,
  SeasonalCancellationRule,
  AuditLog,
  CategoryItem,
  RolePermissions,
  SystemRoleSettings,
  SpecialDay,
} from '../types';
import {
  INITIAL_ADMIN_USERS,
  INITIAL_PARTNERS,
  INITIAL_ROOM_TYPES,
  INITIAL_PACKAGES,
  INITIAL_PACKAGE_CATEGORIES,
  generateInitialDailyRates,
  INITIAL_RESERVATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTLEMENTS,
  DEFAULT_CANCELLATION_RULES,
  INITIAL_MEDIA_ASSETS,
  DEFAULT_SEASON_PERIODS,
  DEFAULT_SEASONAL_CANCELLATION_RULES,
  INITIAL_AUDIT_LOGS,
  DEFAULT_ROLE_SETTINGS,
  DEFAULT_SPECIAL_DAYS,
} from '../mockData';

import { UserRole } from '../types';

export interface DayBreakdownRule {
  useDifferentiated?: boolean;
  applyWeekday?: boolean;
  applyFriday?: boolean;
  applySaturday?: boolean;
  applySpecialDay?: boolean;
  weekday: { price: number; stock: number }; // 일~목
  friday: { price: number; stock: number }; // 금
  saturday: { price: number; stock: number }; // 토
  specialDay?: { price: number; stock: number }; // 스페셜데이
}

interface AppContextType {
  activeMode: 'user' | 'admin';
  setActiveMode: (mode: 'user' | 'admin') => void;

  // Active Authenticated State
  currentPartner: Partner | null;
  currentAdmin: AdminUser | null;

  // Global Collections
  partners: Partner[];
  packages: Package[];
  roomTypes: RoomType[];
  mediaAssets: MediaAsset[];
  cancellationRules: CancellationRule[];
  seasonPeriods: SeasonPeriod[];
  seasonalCancellationRules: SeasonalCancellationRule[];
  auditLogs: AuditLog[];
  dailyRates: DailyRate[];
  reservations: Reservation[];
  adminUsers: AdminUser[];
  notificationLogs: NotificationLog[];
  settlements: Settlement[];

  // Toast / Banner
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Audit Log Action
  addAuditLog: (actionType: AuditLog['actionType'], actionSummary: string, details?: string) => void;

  // Seasonal Cancellation & Period Management
  updateSeasonPeriods: (periods: SeasonPeriod[]) => void;
  updateSeasonalCancellationRules: (rules: SeasonalCancellationRule[]) => void;
  resetSeasonalCancellationRulesToDefault: () => void;

  // Partner User Actions
  authenticatePartnerCode: (code: string) => { success: boolean; partner?: Partner; message?: string };
  logoutPartner: () => void;

  specialDays: SpecialDay[];
  addSpecialDay: (day: Omit<SpecialDay, 'id'>) => SpecialDay;
  updateSpecialDay: (id: string, day: Partial<SpecialDay>) => void;
  deleteSpecialDay: (id: string) => void;

  // Admin Actions & Role Permissions
  roleSettings: SystemRoleSettings;
  updateRolePermissions: (role: 'sales_agent' | 'reservation_staff', permissions: Partial<RolePermissions>) => void;
  resetRolePermissions: () => void;
  hasPermission: (permissionKey: keyof RolePermissions) => boolean;

  loginAdmin: (idOrEmail: string, pass: string) => { success: boolean; user?: AdminUser; message?: string };
  logoutAdmin: () => void;
  registerSalesAgent: (data: { name: string; email: string; phone: string; employeeId: string; role?: UserRole }) => { success: boolean; message: string };
  approveSalesAgent: (agentId: string) => void;
  rejectSalesAgent: (agentId: string) => void;
  deleteAdminUser: (adminId: string) => void;
  updateAdminRole: (adminId: string, newRole: UserRole) => void;
  updateAdminProfile: (adminId: string, data: { name?: string; phone?: string; employeeId?: string }) => void;
  changeAdminPassword: (adminId: string, currentPass: string, newPass: string) => boolean;
  resetAdminUserPassword: (adminId: string, customNewPass?: string) => boolean;
  resetMasterPasswordToDefault: () => void;

  // Partner Management by Admin
  addPartner: (partnerData: { name: string; code: string; logoUrl: string; contactEmail?: string; contactPhone?: string; discountRate?: number }) => Partner;
  updatePartner: (partnerId: string, partnerData: Partial<Partner>) => void;
  deletePartner: (partnerId: string) => void;

  // Room Type Management
  addRoomType: (roomData: Omit<RoomType, 'id'>) => RoomType;
  updateRoomType: (id: string, roomData: Partial<RoomType>) => void;
  deleteRoomType: (id: string) => void;

  // Media Asset Management
  addMediaAsset: (data: { title: string; url: string; category?: string; sizeKb?: number }) => MediaAsset;
  updateMediaAsset: (id: string, data: Partial<MediaAsset>) => void;
  reorderMediaAssets: (assets: MediaAsset[]) => void;
  deleteMediaAsset: (id: string) => void;

  // Cancellation Rules Management
  updateCancellationRules: (newRules: CancellationRule[]) => void;
  resetCancellationRulesToDefault: () => void;

  // Category Management
  packageCategories: CategoryItem[];
  addPackageCategory: (key: string, label: string, description?: string) => void;
  updatePackageCategory: (key: string, newLabel: string, newDescription?: string) => void;
  deletePackageCategory: (key: string) => void;

  // Package Management
  addPackage: (pkgData: Omit<Package, 'id'>) => Package;
  updatePackage: (packageId: string, pkgData: Partial<Package>) => void;
  deletePackage: (packageId: string) => void;

  // Pricing Matrix Management
  updateDailyRate: (packageId: string, roomTypeId: string, date: string, price: number, stock: number) => void;
  bulkUpdateDailyRates: (
    packageId: string,
    roomTypeId: string,
    startDate: string,
    endDate: string,
    price: number,
    stock: number,
    dayBreakdown?: DayBreakdownRule
  ) => void;
  batchUpdateDailyRates: (updates: { packageId: string; roomTypeId: string; date: string; price: number; stock: number }[]) => void;

  // Reservation Flow
  createReservation: (data: {
    partnerCode: string;
    partnerName: string;
    packageId: string;
    packageName: string;
    roomTypeId: string;
    roomTypeName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomCount: number;
    totalPrice: number;
    originalTotalPrice: number;
    discountAmount: number;
    bookerName: string;
    bookerPhone: string;
    bookerEmail: string;
    specialRequests?: string;
    guaranteeCard: Reservation['guaranteeCard'];
  }) => Reservation;

  cancelReservation: (reservationId: string, reason: string) => { success: boolean; reservation?: Reservation; message?: string };
  confirmReservation: (reservationId: string, pmsReservationNo: string) => { success: boolean; reservation?: Reservation; message?: string };
  lookupReservation: (name: string, phoneLast4: string) => Reservation[];

  // Operations: Notification & Settlement
  notificationEmail: string;
  setNotificationEmail: (email: string) => void;
  sendNotification: (reservationId: string, type: NotificationLog['type'], channel: NotificationLog['channel']) => void;
  processRefund: (reservationId: string) => void;
  generateMonthlySettlements: (month: string) => void;
  updateSettlementStatus: (settlementId: string, status: Settlement['status']) => void;

  // Google Workspace Integration (Drive & Sheets)
  googleUser: User | null;
  googleToken: string | null;
  isGoogleConnected: boolean;
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => Promise<void>;
  driveSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  sheetSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncDriveAuditLogs: () => Promise<void>;
  fetchDriveAuditLogs: () => Promise<void>;
  syncGoogleSheetReservations: () => Promise<void>;

  // Dark Mode
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Reset Storage helper
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'OAKVALLEY_CLEAN_MASTER_V2026_09_RESET_DONE';
const SCHEMA_VERSION = 'v2026_09_clean_master_reset_v3';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMode, setActiveMode] = useState<'user' | 'admin'>('user');
  const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);

  // Dark Mode state with persistence & html class toggle
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('OAKVALLEY_DARK_MODE') === 'true';
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('OAKVALLEY_DARK_MODE', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [packages, setPackages] = useState<Package[]>(INITIAL_PACKAGES);
  const [packageCategories, setPackageCategories] = useState<CategoryItem[]>(INITIAL_PACKAGE_CATEGORIES);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(INITIAL_ROOM_TYPES);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(INITIAL_MEDIA_ASSETS);
  const [cancellationRules, setCancellationRules] = useState<CancellationRule[]>(DEFAULT_CANCELLATION_RULES);
  const [seasonPeriods, setSeasonPeriods] = useState<SeasonPeriod[]>(DEFAULT_SEASON_PERIODS);
  const [seasonalCancellationRules, setSeasonalCancellationRules] = useState<SeasonalCancellationRule[]>(DEFAULT_SEASONAL_CANCELLATION_RULES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [dailyRates, setDailyRates] = useState<DailyRate[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(INITIAL_ADMIN_USERS);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(INITIAL_NOTIFICATIONS);
  const [settlements, setSettlements] = useState<Settlement[]>(INITIAL_SETTLEMENTS);
  const [roleSettings, setRoleSettings] = useState<SystemRoleSettings>(DEFAULT_ROLE_SETTINGS);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>(DEFAULT_SPECIAL_DAYS);

  // Master Notification Email Setting
  const [notificationEmail, setNotificationEmailState] = useState<string>(() => {
    const saved = localStorage.getItem('OAKVALLEY_NOTIFICATION_EMAIL');
    return saved || 'master@oakvalley.co.kr';
  });

  const setNotificationEmail = (email: string) => {
    const clean = email.trim();
    setNotificationEmailState(clean);
    localStorage.setItem('OAKVALLEY_NOTIFICATION_EMAIL', clean);
    showToast(`예약 수신 이메일이 [${clean}]로 설정되었습니다.`, 'success');
  };

  // Google Integration States
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [driveSyncStatus, setDriveSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [sheetSyncStatus, setSheetSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuthListener(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const connectGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        showToast(`구글 계정(${res.user.email || res.user.displayName})이 연결되었습니다.`, 'success');

        // Trigger initial background sync
        if (res.accessToken) {
          setSheetSyncStatus('syncing');
          syncAllReservationsToSheet(res.accessToken, reservations).then((ok) => {
            setSheetSyncStatus(ok ? 'success' : 'error');
          });
          setDriveSyncStatus('syncing');
          saveAuditLogToDrive(res.accessToken, auditLogs[0], auditLogs).then((ok) => {
            setDriveSyncStatus(ok ? 'success' : 'error');
          });
        }
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-closed-by-user' ||
        err?.message?.includes('cancelled-popup-request') ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return;
      }
      showToast('구글 연동 중 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    }
  };

  const disconnectGoogle = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setGoogleToken(null);
    showToast('구글 계정 연결이 해제되었습니다.', 'info');
  };

  const syncDriveAuditLogs = async () => {
    if (!googleToken) {
      showToast('구글 계정 연동이 필요합니다.', 'info');
      return;
    }
    setDriveSyncStatus('syncing');
    const ok = await saveAuditLogToDrive(googleToken, auditLogs[0], auditLogs);
    setDriveSyncStatus(ok ? 'success' : 'error');
    if (ok) {
      showToast('작업 이력이 구글드라이브(AI 스튜디오/제휴사 예약창)에 백업되었습니다.', 'success');
    } else {
      showToast('구글드라이브 작업 이력 백업에 실패했습니다.', 'error');
    }
  };

  const fetchDriveAuditLogs = async () => {
    if (!googleToken) {
      showToast('구글 계정 연동이 필요합니다.', 'info');
      return;
    }
    setDriveSyncStatus('syncing');
    const logs = await fetchAuditHistoryFromDrive(googleToken);
    if (logs && logs.length > 0) {
      setAuditLogs(logs);
      setDriveSyncStatus('success');
      showToast(`구글드라이브에서 ${logs.length}건의 작업 이력을 불러왔습니다.`, 'success');
    } else {
      setDriveSyncStatus('error');
      showToast('구글드라이브에서 저장된 작업 이력을 찾을 수 없습니다.', 'info');
    }
  };

  const syncGoogleSheetReservations = async () => {
    if (!googleToken) {
      showToast('구글 계정 연동이 필요합니다.', 'info');
      return;
    }
    setSheetSyncStatus('syncing');
    const ok = await syncAllReservationsToSheet(googleToken, reservations);
    setSheetSyncStatus(ok ? 'success' : 'error');
    if (ok) {
      showToast('구글 시트(1UDi8MePHWE...)에 모든 예약 정보가 연동 및 저장되었습니다.', 'success');
    } else {
      showToast('구글 시트 예약 저장에 실패했습니다.', 'error');
    }
  };

  // Shared Cloud/Server/Firebase Persistence State Refs
  const isLoadedFromServerRef = useRef<boolean>(false);
  const lastSyncedTimestampRef = useRef<string>('');
  const isApplyingRemoteUpdateRef = useRef<boolean>(false);
  const debounceSaveTimeoutRef = useRef<any>(null);

  // Helper to cleanly apply state data received from Firebase or storage
  const applyStateData = useCallback((parsed: any) => {
    if (!parsed) return;
    isApplyingRemoteUpdateRef.current = true;
    if (parsed.partners) setPartners(parsed.partners);
    if (parsed.packages) setPackages(parsed.packages);
    if (parsed.packageCategories) setPackageCategories(parsed.packageCategories);
    if (parsed.roomTypes) setRoomTypes(parsed.roomTypes);
    if (parsed.mediaAssets) setMediaAssets(parsed.mediaAssets);
    if (parsed.cancellationRules) setCancellationRules(parsed.cancellationRules);
    if (parsed.seasonPeriods) setSeasonPeriods(parsed.seasonPeriods);
    if (parsed.seasonalCancellationRules) setSeasonalCancellationRules(parsed.seasonalCancellationRules);
    if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
    if (parsed.dailyRates && parsed.dailyRates.length > 0) setDailyRates(parsed.dailyRates);
    else setDailyRates(generateInitialDailyRates());
    if (parsed.reservations) setReservations(parsed.reservations);
    if (parsed.adminUsers) setAdminUsers(parsed.adminUsers);
    if (parsed.notificationLogs) setNotificationLogs(parsed.notificationLogs);
    if (parsed.settlements) setSettlements(parsed.settlements);
    if (parsed.roleSettings) setRoleSettings(parsed.roleSettings);
    if (parsed.specialDays) setSpecialDays(parsed.specialDays);
    if (parsed.notificationEmail) setNotificationEmailState(parsed.notificationEmail);
    setTimeout(() => {
      isApplyingRemoteUpdateRef.current = false;
    }, 100);
  }, []);

  // 1. Initial State Load & Realtime Subscription via Firebase Firestore
  useEffect(() => {
    let isMounted = true;

    async function initializeSharedState() {
      const initialRates = generateInitialDailyRates();
      const defaultFreshState = {
        partners: INITIAL_PARTNERS,
        packages: INITIAL_PACKAGES,
        packageCategories: INITIAL_PACKAGE_CATEGORIES,
        roomTypes: INITIAL_ROOM_TYPES,
        mediaAssets: INITIAL_MEDIA_ASSETS,
        cancellationRules: DEFAULT_CANCELLATION_RULES,
        seasonPeriods: DEFAULT_SEASON_PERIODS,
        seasonalCancellationRules: DEFAULT_SEASONAL_CANCELLATION_RULES,
        auditLogs: INITIAL_AUDIT_LOGS,
        dailyRates: initialRates,
        reservations: INITIAL_RESERVATIONS,
        adminUsers: INITIAL_ADMIN_USERS,
        notificationLogs: INITIAL_NOTIFICATIONS,
        settlements: INITIAL_SETTLEMENTS,
        roleSettings: DEFAULT_ROLE_SETTINGS,
        specialDays: DEFAULT_SPECIAL_DAYS,
        notificationEmail: 'master@oakvalley.co.kr',
        version: SCHEMA_VERSION,
        _cleanResetDone: true,
      };

      const enforceWipeAndSave = async () => {
        if (!isMounted) return;
        applyStateData(defaultFreshState);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultFreshState));
        const timestamp = new Date().toISOString();
        lastSyncedTimestampRef.current = timestamp;
        isLoadedFromServerRef.current = true;
        await saveFirebaseAppState(defaultFreshState).catch(() => {});
        await fetch('/api/app-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: defaultFreshState, updatedAt: timestamp }),
        }).catch(() => {});
      };

      // 1-A. Try Firebase Firestore first
      try {
        const firestoreData = await getFirebaseAppState();
        if (firestoreData && firestoreData.state && isMounted) {
          const state = firestoreData.state;
          // Check if state is old dirty state
          if (state.version !== SCHEMA_VERSION || !state._cleanResetDone || (state.reservations && state.reservations.length > 0 && !state._userExplicitKeep)) {
            await enforceWipeAndSave();
            return;
          }
          applyStateData(state);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
          lastSyncedTimestampRef.current = firestoreData.updatedAt || new Date().toISOString();
          isLoadedFromServerRef.current = true;
          return;
        }
      } catch {
        // Continue to server endpoint fallback
      }

      // 1-B. Fallback to /api/app-state
      try {
        const res = await fetch('/api/app-state');
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && isMounted) {
            const state = json.data;
            if (state.version !== SCHEMA_VERSION || !state._cleanResetDone || (state.reservations && state.reservations.length > 0 && !state._userExplicitKeep)) {
              await enforceWipeAndSave();
              return;
            }
            applyStateData(state);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
            lastSyncedTimestampRef.current = json.updatedAt || new Date().toISOString();
            isLoadedFromServerRef.current = true;
            saveFirebaseAppState(state).catch(() => {});
            return;
          }
        }
      } catch {
        // Fallback to local storage
      }

      // 1-C. Check localStorage if offline
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed && parsed.version === SCHEMA_VERSION && parsed._cleanResetDone) {
            if (isMounted) {
              applyStateData(parsed);
              isLoadedFromServerRef.current = true;
            }
            saveFirebaseAppState(parsed).catch(() => {});
            fetch('/api/app-state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ state: parsed, updatedAt: new Date().toISOString() }),
            }).catch(() => {});
            return;
          }
        } catch {
          // parse error
        }
      }

      // 1-D. Default Clean State (Master only, 0 reservations, 0 partners)
      if (isMounted) {
        await enforceWipeAndSave();
      }
    }

    initializeSharedState();

    // Setup Firestore Real-time Listener for instant cross-device updates
    const unsubscribeFirestore = subscribeToFirebaseAppState((remoteState, updatedAt) => {
      if (!isMounted || !remoteState) return;
      if (remoteState.version !== SCHEMA_VERSION || !remoteState._cleanResetDone) return;
      if (!lastSyncedTimestampRef.current || new Date(updatedAt).getTime() > new Date(lastSyncedTimestampRef.current).getTime()) {
        applyStateData(remoteState);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteState));
        lastSyncedTimestampRef.current = updatedAt;
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [applyStateData]);

  // 2. Real-time Persistence to Firebase Firestore + Server on ANY change across all tabs
  useEffect(() => {
    if (!isLoadedFromServerRef.current) return;
    if (isApplyingRemoteUpdateRef.current) return;
    if (dailyRates.length === 0) return;

    const stateToSave = {
      partners,
      packages,
      packageCategories,
      roomTypes,
      mediaAssets,
      cancellationRules,
      seasonPeriods,
      seasonalCancellationRules,
      auditLogs,
      dailyRates,
      reservations,
      adminUsers,
      notificationLogs,
      settlements,
      roleSettings,
      specialDays,
      notificationEmail,
    };

    // Save to local device storage instantly
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));

    // Debounced real-time push to Firebase Firestore and Server
    if (debounceSaveTimeoutRef.current) {
      clearTimeout(debounceSaveTimeoutRef.current);
    }

    debounceSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const timestamp = new Date().toISOString();
        lastSyncedTimestampRef.current = timestamp;

        // Direct Realtime update to Firebase Firestore
        await saveFirebaseAppState(stateToSave);

        // Also update backend server cache for dual redundancy
        await fetch('/api/app-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: stateToSave, updatedAt: timestamp }),
        });
      } catch (err) {
        console.error('[Sync Error]', err);
      }
    }, 400);

    return () => {
      if (debounceSaveTimeoutRef.current) {
        clearTimeout(debounceSaveTimeoutRef.current);
      }
    };
  }, [
    partners,
    packages,
    packageCategories,
    roomTypes,
    mediaAssets,
    cancellationRules,
    seasonPeriods,
    seasonalCancellationRules,
    auditLogs,
    dailyRates,
    reservations,
    adminUsers,
    notificationLogs,
    settlements,
    roleSettings,
    specialDays,
    notificationEmail,
  ]);

  const addAuditLog = (actionType: AuditLog['actionType'], actionSummary: string, details?: string) => {
    const actor = currentAdmin ? `${currentAdmin.name}` : '시스템 자동';
    const role = currentAdmin ? currentAdmin.role : 'master';
    const now = new Date();
    const timestamp =
      now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp,
      actorName: actor,
      actorRole: role,
      actionType,
      actionSummary,
      details,
    };

    setAuditLogs((prev) => {
      const updated = [newLog, ...prev];
      if (googleToken) {
        saveAuditLogToDrive(googleToken, newLog, updated);
      }
      return updated;
    });
  };

  const updateSeasonPeriods = (periods: SeasonPeriod[]) => {
    setSeasonPeriods(periods);
    addAuditLog('CANCELLATION', '성수기 / 비수기 시즌 기간 설정 수정', `총 ${periods.length}개 시즌 기간 지정 완료`);
    showToast('성수기/비수기 기간 설정이 저장되었습니다.', 'success');
  };

  const updateSeasonalCancellationRules = (rules: SeasonalCancellationRule[]) => {
    setSeasonalCancellationRules(rules);
    addAuditLog('CANCELLATION', '비수기/성수기 3단계 위약율 규정 매트릭스 변경', `구간 총 ${rules.length}개 항목 설정 완료`);
    showToast('구간별/시즌별 취소 위약율 규정이 저장되었습니다.', 'success');
  };

  const resetSeasonalCancellationRulesToDefault = () => {
    setSeasonPeriods(DEFAULT_SEASON_PERIODS);
    setSeasonalCancellationRules(DEFAULT_SEASONAL_CANCELLATION_RULES);
    addAuditLog('CANCELLATION', '취소 위약금 규정 표준 기본값으로 초기화', '성수기 지정 및 3단계 위약율 초기화');
    showToast('취소 위약금 규정이 표준 기본값으로 초기화되었습니다.', 'info');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Role Permissions Helper
  const hasPermission = (permissionKey: keyof RolePermissions): boolean => {
    if (!currentAdmin) return false;
    if (currentAdmin.role === 'master') return true; // Master has full permissions
    if (currentAdmin.role === 'sales_agent') {
      return roleSettings.sales_agent?.[permissionKey] ?? false;
    }
    if (currentAdmin.role === 'reservation_staff') {
      return roleSettings.reservation_staff?.[permissionKey] ?? false;
    }
    return false;
  };

  const updateRolePermissions = (
    role: 'sales_agent' | 'reservation_staff',
    permissions: Partial<RolePermissions>
  ) => {
    setRoleSettings((prev) => {
      const updated = {
        ...prev,
        [role]: {
          ...prev[role],
          ...permissions,
        },
      };
      addAuditLog(
        'USER_APPROVAL',
        `역할 권한 설정 변경 (${role === 'sales_agent' ? '영업사원' : '예약실 직원'})`,
        JSON.stringify(permissions)
      );
      return updated;
    });
    showToast(`${role === 'sales_agent' ? '영업사원' : '예약실 직원'} 역할 권한 설정이 업데이트되었습니다.`, 'success');
  };

  const resetRolePermissions = () => {
    setRoleSettings(DEFAULT_ROLE_SETTINGS);
    addAuditLog('USER_APPROVAL', '역할 권한 설정 기본값 복원', '');
    showToast('역할별 권한 설정이 기본값으로 초기화되었습니다.', 'info');
  };

  // Partner Code Login
  const authenticatePartnerCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = partners.find((p) => p.code.toUpperCase() === cleanCode && p.active);
    if (found) {
      setCurrentPartner(found);
      showToast(`${found.name} 코드 인증이 완료되었습니다.`, 'success');
      return { success: true, partner: found };
    }
    return { success: false, message: '유효하지 않거나 등록되지 않은 제휴사 코드입니다.' };
  };

  const logoutPartner = () => {
    setCurrentPartner(null);
    showToast('제휴사 접속이 종료되었습니다.', 'info');
  };

  // Admin Login
  const loginAdmin = (idOrEmail: string, pass: string) => {
    const query = idOrEmail.trim().toLowerCase();
    
    // Master Login
    if (query === 'master' || query === 'master-001' || query === 'master@oakvalley.co.kr' || query === 'master@hdc-resort.com') {
      const masterUser = adminUsers.find((u) => u.role === 'master') || INITIAL_ADMIN_USERS[0];
      const expectedPass = masterUser.password || '1234';
      if (pass !== expectedPass) {
        return { success: false, message: '비밀번호가 올바르지 않습니다.' };
      }
      setCurrentAdmin(masterUser);
      showToast(`[마스터] ${masterUser.name}님으로 관리자 접속되었습니다.`, 'success');
      return { success: true, user: masterUser };
    }

    // Reservation Staff & Sales Agent login
    const foundUser = adminUsers.find(
      (u) => (u.employeeId.toLowerCase() === query || u.email.toLowerCase() === query)
    );

    if (foundUser) {
      if (!foundUser.approved) {
        return {
          success: false,
          message: '마스터 관리자의 가입 승인이 진행 중입니다. 승인 후 접속 가능합니다.',
        };
      }

      // Password check
      const expectedPass = foundUser.password || '1234';
      if (pass !== expectedPass) {
        return { success: false, message: '비밀번호가 올바르지 않습니다.' };
      }

      const roleBadge = foundUser.role === 'reservation_staff' ? '예약실 담당' : '영업사원';
      setCurrentAdmin(foundUser);
      showToast(`[${roleBadge}] ${foundUser.name}님으로 접속되었습니다.`, 'success');
      return { success: true, user: foundUser };
    }

    return { success: false, message: '사번/이메일 또는 비밀번호가 올바르지 않습니다.' };
  };

  const logoutAdmin = () => {
    setCurrentAdmin(null);
    showToast('관리자 세션이 종료되었습니다.', 'info');
  };

  const registerSalesAgent = (data: { name: string; email: string; phone: string; employeeId: string; role?: UserRole }) => {
    const existing = adminUsers.find(
      (u) => u.employeeId === data.employeeId || u.email === data.email
    );
    if (existing) {
      return { success: false, message: '이미 등록된 사번 또는 이메일입니다.' };
    }

    const assignedRole = data.role || 'sales_agent';

    const newUser: AdminUser = {
      id: `admin-${assignedRole}-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      employeeId: data.employeeId.toUpperCase(),
      role: assignedRole,
      approved: false, // Requires Master Approval!
      createdAt: new Date().toISOString(),
      password: '1234',
    };

    setAdminUsers((prev) => [...prev, newUser]);
    const roleTitle = assignedRole === 'reservation_staff' ? '예약실 담당자' : '영업사원';
    showToast(`${roleTitle} 가입 신청이 완료되었습니다. 마스터 승인을 기다려주세요.`, 'info');
    return { success: true, message: '가입 신청 완료' };
  };

  const approveSalesAgent = (agentId: string) => {
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === agentId ? { ...u, approved: true } : u))
    );
    showToast('관리자 계정 가입이 마스터 권한으로 승인되었습니다.', 'success');
  };

  const rejectSalesAgent = (agentId: string) => {
    setAdminUsers((prev) => prev.filter((u) => u.id !== agentId));
    showToast('관리자 가입 신청이 거절/삭제되었습니다.', 'info');
  };

  const deleteAdminUser = (adminId: string) => {
    const targetUser = adminUsers.find((u) => u.id === adminId);
    if (!targetUser) return;

    if (targetUser.role === 'master') {
      showToast('마스터 권한 관리자 계정은 삭제할 수 없습니다.', 'error');
      return;
    }

    setAdminUsers((prev) => prev.filter((u) => u.id !== adminId));

    // If deleting the currently logged in admin user
    if (currentAdmin && currentAdmin.id === adminId) {
      setCurrentAdmin(null);
    }

    addAuditLog(
      'USER_APPROVAL',
      `관리자 계정 삭제 (${targetUser.name} / ${targetUser.employeeId})`,
      `역할: ${targetUser.role}, 이메일: ${targetUser.email}`
    );
    showToast(`[${targetUser.name}] 관리자 계정이 삭제 처리되었습니다.`, 'info');
  };

  const updateAdminRole = (adminId: string, newRole: UserRole) => {
    const targetUser = adminUsers.find((u) => u.id === adminId);
    if (!targetUser) return;

    if (targetUser.role === 'master') {
      showToast('마스터 최고 관리자 계정의 역할은 변경할 수 없습니다.', 'error');
      return;
    }

    setAdminUsers((prev) =>
      prev.map((u) => (u.id === adminId ? { ...u, role: newRole } : u))
    );

    if (currentAdmin && currentAdmin.id === adminId) {
      setCurrentAdmin((prev) => (prev ? { ...prev, role: newRole } : null));
    }

    const roleName = newRole === 'sales_agent' ? '영업사원' : newRole === 'reservation_staff' ? '예약실 직원' : '마스터';

    addAuditLog(
      'USER_APPROVAL',
      `관리자 계정 역할 권한 변경 (${targetUser.name} / ${targetUser.employeeId})`,
      `변경 후 역할: ${roleName}`
    );
    showToast(`[${targetUser.name}] 님의 계정 역할이 [${roleName}]으(로) 변경되었습니다.`, 'success');
  };

  const addSpecialDay = (dayData: Omit<SpecialDay, 'id'>): SpecialDay => {
    const newDay: SpecialDay = {
      id: `sd-${Date.now()}`,
      ...dayData,
    };
    setSpecialDays((prev) => [...prev, newDay]);
    addAuditLog('RATE', `스페셜데이/공휴일 일정 추가 (${newDay.date}: ${newDay.name})`, `카테고리: ${newDay.category}`);
    showToast(`[${newDay.name}] 스페셜데이/공휴일 일정이 추가되었습니다.`, 'success');
    return newDay;
  };

  const updateSpecialDay = (id: string, dayData: Partial<SpecialDay>) => {
    setSpecialDays((prev) => prev.map((sd) => (sd.id === id ? { ...sd, ...dayData } : sd)));
    showToast('스페셜데이 일정 정보가 수정되었습니다.', 'success');
  };

  const deleteSpecialDay = (id: string) => {
    const target = specialDays.find((sd) => sd.id === id);
    setSpecialDays((prev) => prev.filter((sd) => sd.id !== id));
    if (target) {
      showToast(`[${target.name}] 스페셜데이 일정이 삭제되었습니다.`, 'info');
    }
  };

  const updateAdminProfile = (adminId: string, data: { name?: string; phone?: string; employeeId?: string }) => {
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === adminId ? { ...u, ...data } : u))
    );
    if (currentAdmin && currentAdmin.id === adminId) {
      setCurrentAdmin((prev) => (prev ? { ...prev, ...data } : null));
    }
    showToast('내 계정 프로필 정보가 수정되었습니다.', 'success');
  };

  const changeAdminPassword = (adminId: string, currentPass: string, newPass: string): boolean => {
    const user = adminUsers.find((u) => u.id === adminId);
    if (!user) {
      showToast('계정을 찾을 수 없습니다.', 'error');
      return false;
    }

    const expectedPass = user.password || '1234';
    if (currentPass !== expectedPass) {
      showToast('현재 비밀번호가 일치하지 않습니다.', 'error');
      return false;
    }

    setAdminUsers((prev) =>
      prev.map((u) => (u.id === adminId ? { ...u, password: newPass } : u))
    );
    if (currentAdmin && currentAdmin.id === adminId) {
      setCurrentAdmin((prev) => (prev ? { ...prev, password: newPass } : null));
    }
    showToast('비밀번호가 성공적으로 변경되었습니다.', 'success');
    return true;
  };

  const resetAdminUserPassword = (adminId: string, customNewPass?: string): boolean => {
    const user = adminUsers.find((u) => u.id === adminId);
    if (!user) {
      showToast('해당 관리자 계정을 찾을 수 없습니다.', 'error');
      return false;
    }

    const newPassword = customNewPass && customNewPass.trim() ? customNewPass.trim() : '1234';

    setAdminUsers((prev) =>
      prev.map((u) => (u.id === adminId ? { ...u, password: newPassword } : u))
    );

    if (currentAdmin && currentAdmin.id === adminId) {
      setCurrentAdmin((prev) => (prev ? { ...prev, password: newPassword } : null));
    }

    addAuditLog(
      'USER_APPROVAL',
      `관리자 계정 비밀번호 강제 재설정/초기화 (${user.name} / ${user.employeeId})`,
      `재설정 방식: ${customNewPass ? `새 비밀번호 직접 지정 (${newPassword})` : '기본 비밀번호(1234) 초기화'}`
    );

    showToast(`[${user.name}] 님의 비밀번호가 '${newPassword}'(으)로 재설정되었습니다.`, 'success');
    return true;
  };

  const resetMasterPasswordToDefault = () => {
    setAdminUsers((prev) =>
      prev.map((u) => (u.role === 'master' ? { ...u, password: '1234' } : u))
    );
    if (currentAdmin && currentAdmin.role === 'master') {
      setCurrentAdmin((prev) => (prev ? { ...prev, password: '1234' } : null));
    }
    showToast('마스터 계정 비밀번호가 기본값(1234)으로 초기화되었습니다.', 'success');
  };

  // Partner Management
  const addPartner = (partnerData: {
    name: string;
    code: string;
    logoUrl: string;
    contactEmail?: string;
    contactPhone?: string;
    discountRate?: number;
  }) => {
    const newPartner: Partner = {
      id: `partner-${Date.now()}`,
      code: partnerData.code.trim().toUpperCase(),
      name: partnerData.name.trim(),
      logoUrl: partnerData.logoUrl || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=150&q=80',
      salesAgentId: currentAdmin?.id || 'admin-master-1',
      salesAgentName: currentAdmin?.name || '담당 관리자',
      createdAt: new Date().toISOString().split('T')[0],
      active: true,
      contactEmail: partnerData.contactEmail || 'contact@partner.com',
      contactPhone: partnerData.contactPhone || '02-1234-5678',
      discountRate: partnerData.discountRate || 30,
    };

    setPartners((prev) => [...prev, newPartner]);
    showToast(`신규 제휴사 [${newPartner.name} / ${newPartner.code}] 등록이 완료되었습니다.`, 'success');
    return newPartner;
  };

  const updatePartner = (partnerId: string, partnerData: Partial<Partner>) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === partnerId ? { ...p, ...partnerData } : p))
    );
    addAuditLog(
      'PARTNER',
      `제휴사 정보 수정 (${partnerData.name || '제휴사'})`,
      `코드: ${partnerData.code || ''}`
    );
    showToast('제휴사 정보가 수정되었습니다.', 'success');
  };

  const deletePartner = (partnerId: string) => {
    const target = partners.find((p) => p.id === partnerId);
    setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    showToast(`제휴사 [${target?.name || ''}]가 삭제되었습니다.`, 'info');
  };

  // Room Type Management
  const addRoomType = (roomData: Omit<RoomType, 'id'>): RoomType => {
    const newRoom: RoomType = {
      ...roomData,
      id: `room-custom-${Date.now()}`,
    };
    setRoomTypes((prev) => [newRoom, ...prev]);
    showToast(`신규 원천 객실 [${newRoom.name}]이(가) 등록되었습니다.`, 'success');
    return newRoom;
  };

  const updateRoomType = (id: string, roomData: Partial<RoomType>) => {
    setRoomTypes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...roomData } : r))
    );
    showToast('원천 객실 정보가 수정되었습니다.', 'success');
  };

  const deleteRoomType = (id: string) => {
    setRoomTypes((prev) => prev.filter((r) => r.id !== id));
    showToast('원천 객실이 삭제되었습니다.', 'info');
  };

  // Media Asset Management
  const addMediaAsset = (data: { title: string; url: string; category?: string; sizeKb?: number }): MediaAsset => {
    const newAsset: MediaAsset = {
      id: `img-${Date.now()}`,
      title: data.title || '업로드 이미지',
      url: data.url,
      category: data.category || '기타',
      uploadedAt: new Date().toISOString().split('T')[0],
      sizeKb: data.sizeKb || Math.round(data.url.length / 1024),
    };
    setMediaAssets((prev) => [newAsset, ...prev]);
    showToast(`이미지 [${newAsset.title}]가 보관함에 등록되었습니다.`, 'success');
    return newAsset;
  };

  const updateMediaAsset = (id: string, data: Partial<MediaAsset>) => {
    setMediaAssets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data } : m))
    );
    showToast('이미지 정보가 수정되었습니다.', 'success');
  };

  const reorderMediaAssets = (assets: MediaAsset[]) => {
    setMediaAssets(assets);
    showToast('이미지 순서가 변경되었습니다.', 'info');
  };

  const deleteMediaAsset = (id: string) => {
    setMediaAssets((prev) => prev.filter((m) => m.id !== id));
    showToast('보관함 이미지가 삭제되었습니다.', 'info');
  };

  // Cancellation Rules Management
  const updateCancellationRules = (newRules: CancellationRule[]) => {
    setCancellationRules(newRules);
    showToast('취소 위약금 구간 규정이 업데이트되었습니다.', 'success');
  };

  const resetCancellationRulesToDefault = () => {
    setCancellationRules(DEFAULT_CANCELLATION_RULES);
    showToast('취소 위약금 규정이 기본 표준값으로 초기화되었습니다.', 'info');
  };

  // Category Management
  const addPackageCategory = (key: string, label: string, description?: string) => {
    const trimmedKey = key.trim().toUpperCase().replace(/\s+/g, '_');
    if (!trimmedKey || !label.trim()) {
      showToast('카테고리 연동 키와 표시 명칭을 입력해주세요.', 'error');
      return;
    }
    if (packageCategories.some((c) => c.key === trimmedKey)) {
      showToast(`이미 존재하거나 등록된 카테고리 키 [${trimmedKey}]입니다.`, 'error');
      return;
    }
    const newCat: CategoryItem = { key: trimmedKey, label: label.trim(), description: description?.trim() };
    setPackageCategories((prev) => [...prev, newCat]);
    addAuditLog('PACKAGE', `신규 카테고리 [${label.trim()} (${trimmedKey})] 등록`, `설명: ${description || '없음'}`);
    showToast(`새 카테고리 [${label.trim()}]가 등록되었습니다.`, 'success');
  };

  const updatePackageCategory = (key: string, newLabel: string, newDescription?: string) => {
    setPackageCategories((prev) =>
      prev.map((c) => (c.key === key ? { ...c, label: newLabel.trim(), description: newDescription?.trim() } : c))
    );
    setPackages((prev) =>
      prev.map((p) => (p.category === key ? { ...p, categoryLabel: newLabel.trim() } : p))
    );
    addAuditLog('PACKAGE', `카테고리 [${key}] 명칭 변경 -> [${newLabel.trim()}]`, `설명: ${newDescription || '없음'}`);
    showToast(`카테고리 명칭이 [${newLabel.trim()}](으)로 수정되었습니다.`, 'success');
  };

  const deletePackageCategory = (key: string) => {
    const packagesUsingCategory = packages.filter((p) => p.category === key);
    if (packagesUsingCategory.length > 0) {
      showToast(`이 카테고리를 사용하는 패키지가 ${packagesUsingCategory.length}건 존재하여 삭제할 수 없습니다.`, 'error');
      return;
    }
    const cat = packageCategories.find((c) => c.key === key);
    setPackageCategories((prev) => prev.filter((c) => c.key !== key));
    addAuditLog('PACKAGE', `카테고리 [${cat?.label || key}] 삭제`, '');
    showToast(`카테고리가 삭제되었습니다.`, 'info');
  };

  // Package Management
  const addPackage = (pkgData: Omit<Package, 'id'>) => {
    const newPkg: Package = {
      ...pkgData,
      id: `pkg-${Date.now()}`,
    };
    setPackages((prev) => [...prev, newPkg]);
    showToast(`패키지 [${newPkg.name}]가 성공적으로 등록되었습니다.`, 'success');
    return newPkg;
  };

  const updatePackage = (packageId: string, pkgData: Partial<Package>) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === packageId ? { ...p, ...pkgData } : p))
    );
    showToast('패키지 정보가 수정되었습니다.', 'success');
  };

  const deletePackage = (packageId: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== packageId));
    showToast('패키지가 삭제되었습니다.', 'info');
  };

  // Pricing Matrix Management
  const updateDailyRate = (
    packageId: string,
    roomTypeId: string,
    date: string,
    price: number,
    stock: number
  ) => {
    setDailyRates((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.packageId === packageId && r.roomTypeId === roomTypeId && r.date === date
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          price,
          stock,
          status: stock > 0 ? 'available' : 'soldout',
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `rate-${packageId}-${roomTypeId}-${date}`,
            packageId,
            roomTypeId,
            date,
            price,
            originalPrice: Math.round((price * 1.4) / 1000) * 1000,
            stock,
            status: stock > 0 ? 'available' : 'soldout',
          },
        ];
      }
    });
    showToast(`${date} 요금/재고가 수정되었습니다.`, 'success');
  };

  const bulkUpdateDailyRates = (
    packageId: string,
    roomTypeId: string,
    startDate: string,
    endDate: string,
    price: number,
    stock: number,
    dayBreakdown?: DayBreakdownRule
  ) => {
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const [eY, eM, eD] = endDate.split('-').map(Number);
    const cur = new Date(sY, sM - 1, sD, 12, 0, 0);
    const end = new Date(eY, eM - 1, eD, 12, 0, 0);
    const datesToUpdate: { dStr: string; dayOfWeek: number }[] = [];

    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      datesToUpdate.push({
        dStr: `${y}-${m}-${d}`,
        dayOfWeek: cur.getDay(),
      });
      cur.setDate(cur.getDate() + 1);
    }

    setDailyRates((prev) => {
      const rateMap = new Map<string, DailyRate>(prev.map((r) => [`${r.packageId}_${r.roomTypeId}_${r.date}`, r]));

      datesToUpdate.forEach(({ dStr, dayOfWeek }) => {
        const key = `${packageId}_${roomTypeId}_${dStr}`;
        const existing = rateMap.get(key);

        const isSpecialDay = specialDays.some((sd) => sd.date === dStr);

        let applyPrice = price;
        let applyStock = stock;
        let shouldApply = true;

        if (dayBreakdown && dayBreakdown.useDifferentiated) {
          if (isSpecialDay) {
            if (dayBreakdown.applySpecialDay === false) {
              shouldApply = false;
            } else if (dayBreakdown.specialDay) {
              applyPrice = dayBreakdown.specialDay.price;
              applyStock = dayBreakdown.specialDay.stock;
            }
          } else if (dayOfWeek === 5) {
            if (dayBreakdown.applyFriday === false) {
              shouldApply = false;
            } else if (dayBreakdown.friday) {
              applyPrice = dayBreakdown.friday.price;
              applyStock = dayBreakdown.friday.stock;
            }
          } else if (dayOfWeek === 6) {
            if (dayBreakdown.applySaturday === false) {
              shouldApply = false;
            } else if (dayBreakdown.saturday) {
              applyPrice = dayBreakdown.saturday.price;
              applyStock = dayBreakdown.saturday.stock;
            }
          } else {
            if (dayBreakdown.applyWeekday === false) {
              shouldApply = false;
            } else if (dayBreakdown.weekday) {
              applyPrice = dayBreakdown.weekday.price;
              applyStock = dayBreakdown.weekday.stock;
            }
          }
        }

        if (shouldApply) {
          rateMap.set(key, {
            id: existing?.id || `rate-${packageId}-${roomTypeId}-${dStr}`,
            packageId,
            roomTypeId,
            date: dStr,
            price: applyPrice,
            originalPrice: Math.round((applyPrice * 1.4) / 1000) * 1000,
            stock: applyStock,
            status: applyStock > 0 ? 'available' : 'soldout',
          });
        }
      });

      return Array.from(rateMap.values());
    });

    const breakdownMsg = dayBreakdown?.useDifferentiated ? ' (주중/금/토 차등 적용)' : '';
    showToast(`${startDate} ~ ${endDate} 일괄 요금/재고 수정이 완료되었습니다.${breakdownMsg}`, 'success');
  };

  const batchUpdateDailyRates = (
    updates: { packageId: string; roomTypeId: string; date: string; price: number; stock: number }[]
  ) => {
    setDailyRates((prev) => {
      const rateMap = new Map<string, DailyRate>(
        prev.map((r) => [`${r.packageId}_${r.roomTypeId}_${r.date}`, r])
      );

      updates.forEach((item) => {
        const key = `${item.packageId}_${item.roomTypeId}_${item.date}`;
        const existing = rateMap.get(key);

        rateMap.set(key, {
          id: existing?.id || `rate-${item.packageId}-${item.roomTypeId}-${item.date}`,
          packageId: item.packageId,
          roomTypeId: item.roomTypeId,
          date: item.date,
          price: item.price,
          originalPrice: Math.round((item.price * 1.4) / 1000) * 1000,
          stock: item.stock,
          status: item.stock > 0 ? 'available' : 'soldout',
        });
      });

      return Array.from(rateMap.values());
    });

    showToast(`엑셀 일괄 업로드 완료: 총 ${updates.length}건의 요금/재고 데이터가 동기화되었습니다.`, 'success');
  };

  // Reservation Flow
  const createReservation = (data: {
    partnerCode: string;
    partnerName: string;
    packageId: string;
    packageName: string;
    roomTypeId: string;
    roomTypeName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomCount: number;
    totalPrice: number;
    originalTotalPrice: number;
    discountAmount: number;
    bookerName: string;
    bookerPhone: string;
    bookerEmail: string;
    specialRequests?: string;
    guaranteeCard: Reservation['guaranteeCard'];
  }): Reservation => {
    const phoneClean = data.bookerPhone.replace(/[^0-9]/g, '');
    const phoneLast4 = phoneClean.slice(-4) || '0000';

    const dateCompact = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reservationId = `OV-REQ-${dateCompact}-${randomSuffix}`;

    const newRes: Reservation = {
      ...data,
      id: reservationId,
      bookerPhoneLast4: phoneLast4,
      status: 'pending',
      createdAt: new Date().toISOString(),
      refundStatus: 'none',
    };

    setReservations((prev) => {
      const updated = [newRes, ...prev];
      if (googleToken) {
        syncSingleReservationToSheet(googleToken, newRes, updated);
      }
      return updated;
    });

    addAuditLog(
      'RESERVATION',
      `신규 제휴 예약 신청 접수 (${newRes.bookerName} / ${newRes.packageName})`,
      `접수번호: ${newRes.id}, 제휴사: ${newRes.partnerName}(${newRes.partnerCode}), 결제금액: ${newRes.totalPrice.toLocaleString()}원`
    );

    // Send Kakao Alimtalk simulation log automatically
    const notifText = `[오크밸리리조트] ${newRes.bookerName}님, ${newRes.partnerName} 특가 예약 신청이 완료되었습니다. (확정 대기중)\n접수번호: ${newRes.id}\n입실일: ${newRes.checkIn} (${newRes.nights}박)\n객실: ${newRes.roomTypeName}\n관리자가 객실확인 후 예약번호를 발급하면 확정 문자가 발송됩니다.`;

    const newNotif: NotificationLog = {
      id: `notif-${Date.now()}`,
      reservationId: newRes.id,
      recipientPhone: newRes.bookerPhone,
      recipientName: newRes.bookerName,
      type: 'BOOKING_CONFIRMED',
      channel: 'KAKAO_ALIMTALK',
      title: '[오크밸리리조트] 제휴 임직원 예약 신청 접수 (대기)',
      content: notifText,
      sentAt: new Date().toISOString(),
      status: 'SUCCESS',
    };

    // Email Notification to the Booker (예약 대기 안내 메일)
    const bookerEmailText = `안녕하세요, ${newRes.bookerName}님.\n\n오크밸리 리조트 제휴기업 임직원 할인 예약을 신청해주셔서 대단히 감사합니다.\n현재 객실 및 요금 배정 대기 상태이며, 담당 직원의 검토 및 확정 절차가 진행 중입니다.\n\n[예약 신청(대기상황) 상세 내역]\n- 접수번호: ${newRes.id}\n- 제휴기업: ${newRes.partnerName}\n- 예약 상품: ${newRes.packageName}\n- 객실 타입: ${newRes.roomTypeName}\n- 이용 일정: ${newRes.checkIn} ~ ${newRes.checkOut} (${newRes.nights}박, ${newRes.roomCount}실)\n- 총 결제 금액: ${newRes.totalPrice.toLocaleString()}원 (현장 후불 결제)\n- 문의 연락처: 1588-7676\n\n해당 예약이 최종 확정되면 확정 번호와 함께 예약 확정 메일 및 카카오 알림톡이 발송됩니다.\n감사합니다.\n\n(본 메일은 마스터가 지정한 발송 전용 메일 주소 [${notificationEmail || 'master@oakvalley.co.kr'}]를 통해 발송되었습니다.)`;

    const bookerEmailNotif: NotificationLog = {
      id: `notif-booker-email-pending-${Date.now()}`,
      reservationId: newRes.id,
      recipientPhone: newRes.bookerPhone,
      recipientName: newRes.bookerName,
      recipientEmail: newRes.bookerEmail,
      senderEmail: notificationEmail || 'master@oakvalley.co.kr',
      type: 'BOOKING_PENDING',
      channel: 'EMAIL',
      title: `📧 [예약 대기 안내] 오크밸리 리조트 예약 신청이 접수되었습니다.`,
      content: bookerEmailText,
      sentAt: new Date().toISOString(),
      status: 'SUCCESS',
    };

    // Automatic Notification Email to Master-Configured Recipient
    if (notificationEmail) {
      const emailNotifText = `[신규 예약 발생 자동 알림 메일]\n수신메일: ${notificationEmail}\n접수번호: ${newRes.id}\n제휴사: ${newRes.partnerName} (${newRes.partnerCode})\n예약자: ${newRes.bookerName} (연락처: ${newRes.bookerPhone}, 이메일: ${newRes.bookerEmail})\n상품명: ${newRes.packageName}\n객실: ${newRes.roomTypeName}\n일정: ${newRes.checkIn} ~ ${newRes.checkOut} (${newRes.nights}박, ${newRes.roomCount}실)\n결제금액: ${newRes.totalPrice.toLocaleString()}원`;

      const emailNotif: NotificationLog = {
        id: `notif-email-${Date.now()}`,
        reservationId: newRes.id,
        recipientPhone: notificationEmail,
        recipientName: `마스터 알림 수신자 (${notificationEmail})`,
        type: 'BOOKING_CONFIRMED',
        channel: 'SMS',
        title: `📧 [신규 예약 알림 메일 발송] ${newRes.partnerName} - ${newRes.bookerName}`,
        content: emailNotifText,
        sentAt: new Date().toISOString(),
        status: 'SUCCESS',
      };

      setNotificationLogs((prev) => [bookerEmailNotif, emailNotif, newNotif, ...prev]);

      addAuditLog(
        'RESERVATION',
        `[자동 메일 알림] 신규 예약 신청 알림 메일 발송 -> ${notificationEmail}`,
        `접수번호: ${newRes.id}, 고객: ${newRes.bookerName}, 수신메일: ${notificationEmail}`
      );

      showToast(`예약 대기 메일이 고객 이메일(${newRes.bookerEmail})로 자동 전송되었습니다. (발송: ${notificationEmail})`, 'success');
    } else {
      setNotificationLogs((prev) => [bookerEmailNotif, newNotif, ...prev]);
      showToast(`예약 신청 및 대기 안내 메일이 고객 이메일(${newRes.bookerEmail})로 발송되었습니다.`, 'success');
    }

    return newRes;
  };

  // Confirm Pending Reservation with Reservation Number (PMS No)
  const confirmReservation = (reservationId: string, pmsReservationNo: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) {
      return { success: false, message: '해당 예약을 찾을 수 없습니다.' };
    }

    const finalNo = pmsReservationNo.trim();
    if (!finalNo) {
      return { success: false, message: '확정 예약번호를 입력해주세요.' };
    }

    const updatedRes: Reservation = {
      ...target,
      status: 'confirmed',
      pmsReservationNo: finalNo,
      confirmedAt: new Date().toISOString(),
      confirmedBy: currentAdmin ? `${currentAdmin.name}` : '관리자',
    };

    setReservations((prev) => {
      const updated = prev.map((r) => (r.id === reservationId ? updatedRes : r));
      if (googleToken) {
        syncSingleReservationToSheet(googleToken, updatedRes, updated);
      }
      return updated;
    });

    addAuditLog(
      'RESERVATION',
      `예약 확정 번호 발급 완료 (${target.bookerName} / PMS No: ${finalNo})`,
      `접수번호: ${target.id}, 확정일시: ${updatedRes.confirmedAt}`
    );

    // Send Kakao Alimtalk Notification
    const notifText = `[오크밸리리조트] ${target.bookerName}님, ${target.partnerName} 특가 예약이 확정되었습니다.\n\n▶ 확정 예약번호: ${finalNo}\n▶ 입실일: ${target.checkIn} (${target.nights}박)\n▶ 객실: ${target.roomTypeName}\n▶ 결제: 현장결제 (오픈카드 보증 완료)\n▶ 문의: 1588-7676`;

    // Email Notification to the Booker (예약 확정 안내 메일)
    const bookerConfirmEmailText = `안녕하세요, ${target.bookerName}님.\n\n오크밸리 리조트 제휴기업 임직원 특가 예약이 성공적으로 확정되었습니다.\n리조트 이용 시 프런트 데스크에서 본인 확인 후 입실이 가능합니다.\n\n[예약 확정 상세 내역]\n- 확정 예약번호(PMS No): ${finalNo}\n- 접수번호: ${target.id}\n- 제휴기업: ${target.partnerName}\n- 예약 상품: ${target.packageName}\n- 객실 타입: ${target.roomTypeName}\n- 이용 일정: ${target.checkIn} ~ ${target.checkOut} (${target.nights}박, ${target.roomCount}실)\n- 총 결제 금액: ${target.totalPrice.toLocaleString()}원 (현장 후불 결제)\n- 문의 연락처: 1588-7676\n\n즐겁고 편안한 여행이 되시길 바랍니다.\n감사합니다.\n\n(본 메일은 마스터가 지정한 발송 전용 메일 주소 [${notificationEmail || 'master@oakvalley.co.kr'}]를 통해 발송되었습니다.)`;

    const bookerConfirmEmailNotif: NotificationLog = {
      id: `notif-booker-email-confirm-${Date.now()}`,
      reservationId: target.id,
      recipientPhone: target.bookerPhone,
      recipientName: target.bookerName,
      recipientEmail: target.bookerEmail,
      senderEmail: notificationEmail || 'master@oakvalley.co.kr',
      type: 'BOOKING_CONFIRMED',
      channel: 'EMAIL',
      title: `📧 [예약 확정] 오크밸리 리조트 예약이 성공적으로 확정되었습니다.`,
      content: bookerConfirmEmailText,
      sentAt: new Date().toISOString(),
      status: 'SUCCESS',
    };

    setNotificationLogs((prev) => [
      bookerConfirmEmailNotif,
      {
        id: `notif-${Date.now()}`,
        reservationId: target.id,
        recipientPhone: target.bookerPhone,
        recipientName: target.bookerName,
        type: 'BOOKING_CONFIRMED',
        channel: 'KAKAO_ALIMTALK',
        title: '[오크밸리리조트] 제휴 임직원 예약 확정 완료',
        content: notifText,
        sentAt: new Date().toISOString(),
        status: 'SUCCESS',
      },
      ...prev,
    ]);

    addAuditLog(
      'RESERVATION',
      `[자동 메일 알림] 예약 확정 알림 메일 발송 -> ${target.bookerEmail}`,
      `접수번호: ${target.id}, 고객: ${target.bookerName}, 수신메일: ${target.bookerEmail}, 발송처: ${notificationEmail || 'master@oakvalley.co.kr'}`
    );

    showToast(`[예약 확정] ${target.bookerName}님의 예약이 예약번호(${finalNo})로 확정되었으며, 확정 안내 메일이 고객 이메일(${target.bookerEmail})로 전송되었습니다.`, 'success');
    return { success: true, reservation: updatedRes };
  };

  // Cancellation & Refund Automation
  const cancelReservation = (reservationId: string, reason: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) {
      return { success: false, message: '해당 예약을 찾을 수 없습니다.' };
    }

    if (target.status === 'cancelled') {
      return { success: false, message: '이미 취소 처리된 예약입니다.' };
    }

    // Calculate penalty based on Check-in date gap or pending status
    let penaltyRate = 0; // %
    let penaltyAmount = 0;
    let refundAmount = target.totalPrice;

    if (target.status === 'pending') {
      // Pending reservation cancellation has 0 penalty
      penaltyRate = 0;
      penaltyAmount = 0;
      refundAmount = target.totalPrice;
    } else {
      const checkInDate = new Date(target.checkIn);
      const today = new Date();
      const diffTime = checkInDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Calculate penalty based on configured cancellation rules
      const sortedRules = [...cancellationRules].sort((a, b) => b.minDays - a.minDays);
      const matchedRule = sortedRules.find((rule) => diffDays >= rule.minDays);

      if (matchedRule) {
        penaltyRate = matchedRule.penaltyRate;
      } else {
        penaltyRate = 100;
      }

      penaltyAmount = Math.round((target.totalPrice * penaltyRate) / 100);
      refundAmount = target.totalPrice - penaltyAmount;
    }

    const updatedRes: Reservation = {
      ...target,
      status: 'cancelled',
      refundStatus: penaltyAmount === 0 ? 'completed' : 'pending',
      cancellationPenaltyRate: penaltyRate,
      penaltyAmount,
      refundAmount,
      cancelReason: reason || '고객 또는 관리자 요청으로 인한 취소',
      cancelledAt: new Date().toISOString(),
    };

    setReservations((prev) => {
      const updated = prev.map((r) => (r.id === reservationId ? updatedRes : r));
      if (googleToken) {
        syncSingleReservationToSheet(googleToken, updatedRes, updated);
      }
      return updated;
    });

    addAuditLog(
      'CANCELLATION',
      `예약 취소 접수 및 처리 (${target.bookerName} / 위약금: ${penaltyAmount.toLocaleString()}원)`,
      `접수번호: ${target.id}, 취소사유: ${reason || '고객/관리자 요청'}`
    );

    // Send Cancellation SMS
    const resIdentifier = target.pmsReservationNo ? `예약번호 ${target.pmsReservationNo}` : `접수번호 ${target.id}`;
    const notifContent = `[오크밸리리조트] ${target.bookerName}님, ${resIdentifier} 건이 취소 처리되었습니다.\n사유: ${reason || '객실 수량 부족 / 예약 불가'}\n위약금: ${penaltyAmount.toLocaleString()}원\n오픈카드 보증은 즉시 해제 처리되었습니다.`;

    // Email Notification to the Booker (예약 취소 안내 메일)
    const bookerCancelEmailText = `안녕하세요, ${target.bookerName}님.\n\n오크밸리 리조트 예약이 취소 처리되었음을 안내해 드립니다.\n\n[예약 취소 상세 내역]\n- 대상 예약번호(접수번호): ${target.pmsReservationNo || target.id}\n- 제휴기업: ${target.partnerName}\n- 예약 상품: ${target.packageName}\n- 객실 타입: ${target.roomTypeName}\n- 이용 일정: ${target.checkIn} ~ ${target.checkOut}\n- 취소 사유: ${reason || '고객 또는 관리자 요청으로 인한 취소'}\n- 발생 위약금: ${penaltyAmount.toLocaleString()}원\n- 보증 카드 상태: 즉시 보증 해제 및 취소\n- 문의 연락처: 1588-7676\n\n이용에 불편을 드려 대단히 죄송하며, 다른 기회에 다시 모실 수 있기를 기대합니다.\n감사합니다.\n\n(본 메일은 마스터가 지정한 발송 전용 메일 주소 [${notificationEmail || 'master@oakvalley.co.kr'}]를 통해 발송되었습니다.)`;

    const bookerCancelEmailNotif: NotificationLog = {
      id: `notif-booker-email-cancel-${Date.now()}`,
      reservationId: target.id,
      recipientPhone: target.bookerPhone,
      recipientName: target.bookerName,
      recipientEmail: target.bookerEmail,
      senderEmail: notificationEmail || 'master@oakvalley.co.kr',
      type: 'CANCELLATION',
      channel: 'EMAIL',
      title: `📧 [예약 취소 안내] 오크밸리 리조트 예약이 취소되었습니다.`,
      content: bookerCancelEmailText,
      sentAt: new Date().toISOString(),
      status: 'SUCCESS',
    };

    setNotificationLogs((prev) => [
      bookerCancelEmailNotif,
      {
        id: `notif-${Date.now()}`,
        reservationId: target.id,
        recipientPhone: target.bookerPhone,
        recipientName: target.bookerName,
        type: 'CANCELLATION',
        channel: 'SMS',
        title: '[오크밸리리조트] 예약 취소 안내',
        content: notifContent,
        sentAt: new Date().toISOString(),
        status: 'SUCCESS',
      },
      ...prev,
    ]);

    addAuditLog(
      'CANCELLATION',
      `[자동 메일 알림] 예약 취소 안내 메일 발송 -> ${target.bookerEmail}`,
      `접수번호: ${target.id}, 고객: ${target.bookerName}, 수신메일: ${target.bookerEmail}, 발송처: ${notificationEmail || 'master@oakvalley.co.kr'}`
    );

    showToast(`예약 취소가 완료되었으며, 취소 안내 메일이 고객 이메일(${target.bookerEmail})로 전송되었습니다.`, 'info');

    return { success: true, reservation: updatedRes };
  };

  // Lookup Reservation
  const lookupReservation = (name: string, phoneLast4: string) => {
    const cleanName = name.trim();
    const cleanLast4 = phoneLast4.trim();

    return reservations.filter((r) => {
      const matchName = r.bookerName.trim() === cleanName;
      const matchPhone = r.bookerPhoneLast4 === cleanLast4 || r.bookerPhone.slice(-4) === cleanLast4;
      return matchName && matchPhone;
    });
  };

  // Operations Helpers
  const sendNotification = (
    reservationId: string,
    type: NotificationLog['type'],
    channel: NotificationLog['channel']
  ) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;

    const newLog: NotificationLog = {
      id: `notif-${Date.now()}`,
      reservationId,
      recipientPhone: res.bookerPhone,
      recipientName: res.bookerName,
      type,
      channel,
      title: type === 'REMINDER_CHECKIN' ? '[오크밸리리조트] 내일 입실 안내' : '[오크밸리리조트] 알림톡 전송',
      content: `[오크밸리리조트] ${res.bookerName}님, ${res.checkIn} 입실 예정이신 ${res.roomTypeName} 객실 체크인 준비가 완료되었습니다. 오크밸리리조트 오시는길: 강원특별자치도 원주시 지정면 오크밸리1길 66`,
      sentAt: new Date().toISOString(),
      status: 'SUCCESS',
    };

    setNotificationLogs((prev) => [newLog, ...prev]);
    showToast(`고객 [${res.bookerName}]님에게 ${channel === 'KAKAO_ALIMTALK' ? '카카오 알림톡' : '문자'}이 발송되었습니다.`, 'success');
  };

  const processRefund = (reservationId: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId ? { ...r, refundStatus: 'completed' } : r
      )
    );
    showToast(`예약번호 [${reservationId}] 환불 승인 처리가 완료되었습니다.`, 'success');
  };

  const generateMonthlySettlements = (month: string) => {
    // Generate settlements for all partners for the specified month
    const newSettlements: Settlement[] = partners.map((partner) => {
      const partnerRes = reservations.filter(
        (r) => r.partnerCode === partner.code && r.checkIn.startsWith(month) && r.status !== 'cancelled'
      );

      const gross = partnerRes.reduce((acc, cur) => acc + cur.originalTotalPrice, 0);
      const discountAmount = Math.round((gross * (partner.discountRate || 30)) / 100);
      const net = gross - discountAmount;

      return {
        id: `stl-${month}-${partner.id}`,
        partnerId: partner.id,
        partnerCode: partner.code,
        partnerName: partner.name,
        month,
        totalBookings: partnerRes.length,
        grossAmount: gross,
        discountRate: partner.discountRate || 30,
        discountAmount,
        netSettlementAmount: net,
        status: 'DRAFT',
      };
    });

    setSettlements((prev) => {
      const filterOutMonth = prev.filter((s) => s.month !== month);
      return [...filterOutMonth, ...newSettlements];
    });

    showToast(`${month} 정산 내역이 성공적으로 생성되었습니다.`, 'success');
  };

  const updateSettlementStatus = (settlementId: string, status: Settlement['status']) => {
    setSettlements((prev) =>
      prev.map((s) =>
        s.id === settlementId
          ? {
              ...s,
              status,
              settledAt: status === 'SETTLED' ? new Date().toISOString().split('T')[0] : s.settledAt,
            }
          : s
      )
    );
    showToast('정산 상태가 변경되었습니다.', 'success');
  };

  const resetToDefaultData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    const initialRates = generateInitialDailyRates();
    setPartners(INITIAL_PARTNERS);
    setPackages(INITIAL_PACKAGES);
    setPackageCategories(INITIAL_PACKAGE_CATEGORIES);
    setRoomTypes(INITIAL_ROOM_TYPES);
    setMediaAssets(INITIAL_MEDIA_ASSETS);
    setCancellationRules(DEFAULT_CANCELLATION_RULES);
    setSeasonPeriods(DEFAULT_SEASON_PERIODS);
    setSeasonalCancellationRules(DEFAULT_SEASONAL_CANCELLATION_RULES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setDailyRates(initialRates);
    setReservations(INITIAL_RESERVATIONS);
    setAdminUsers(INITIAL_ADMIN_USERS);
    setNotificationLogs(INITIAL_NOTIFICATIONS);
    setSettlements(INITIAL_SETTLEMENTS);
    setRoleSettings(DEFAULT_ROLE_SETTINGS);
    setSpecialDays(DEFAULT_SPECIAL_DAYS);
    setCurrentPartner(null);
    setCurrentAdmin(null);

    const defaultStatePayload = {
      partners: INITIAL_PARTNERS,
      packages: INITIAL_PACKAGES,
      packageCategories: INITIAL_PACKAGE_CATEGORIES,
      roomTypes: INITIAL_ROOM_TYPES,
      mediaAssets: INITIAL_MEDIA_ASSETS,
      cancellationRules: DEFAULT_CANCELLATION_RULES,
      seasonPeriods: DEFAULT_SEASON_PERIODS,
      seasonalCancellationRules: DEFAULT_SEASONAL_CANCELLATION_RULES,
      auditLogs: INITIAL_AUDIT_LOGS,
      dailyRates: initialRates,
      reservations: INITIAL_RESERVATIONS,
      adminUsers: INITIAL_ADMIN_USERS,
      notificationLogs: INITIAL_NOTIFICATIONS,
      settlements: INITIAL_SETTLEMENTS,
      roleSettings: DEFAULT_ROLE_SETTINGS,
      specialDays: DEFAULT_SPECIAL_DAYS,
      notificationEmail: 'master@oakvalley.co.kr',
    };

    saveFirebaseAppState(defaultStatePayload).catch(() => {});
    fetch('/api/app-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: defaultStatePayload, updatedAt: new Date().toISOString() }),
    }).catch(() => {});

    showToast('모든 데모 데이터가 초기화되었습니다.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        activeMode,
        setActiveMode,
        currentPartner,
        currentAdmin,
        partners,
        packages,
        packageCategories,
        roomTypes,
        mediaAssets,
        cancellationRules,
        seasonPeriods,
        seasonalCancellationRules,
        auditLogs,
        dailyRates,
        reservations,
        adminUsers,
        notificationLogs,
        settlements,
        notificationEmail,
        setNotificationEmail,
        toast,
        showToast,
        addAuditLog,
        updateSeasonPeriods,
        updateSeasonalCancellationRules,
        resetSeasonalCancellationRulesToDefault,
        specialDays,
        addSpecialDay,
        updateSpecialDay,
        deleteSpecialDay,
        authenticatePartnerCode,
        logoutPartner,
        loginAdmin,
        logoutAdmin,
        roleSettings,
        updateRolePermissions,
        resetRolePermissions,
        hasPermission,
        registerSalesAgent,
        approveSalesAgent,
        rejectSalesAgent,
        deleteAdminUser,
        updateAdminRole,
        updateAdminProfile,
        changeAdminPassword,
        resetAdminUserPassword,
        resetMasterPasswordToDefault,
        addPartner,
        updatePartner,
        deletePartner,
        addRoomType,
        updateRoomType,
        deleteRoomType,
        addMediaAsset,
        updateMediaAsset,
        reorderMediaAssets,
        deleteMediaAsset,
        updateCancellationRules,
        resetCancellationRulesToDefault,
        addPackageCategory,
        updatePackageCategory,
        deletePackageCategory,
        addPackage,
        updatePackage,
        deletePackage,
        updateDailyRate,
        bulkUpdateDailyRates,
        batchUpdateDailyRates,
        createReservation,
        confirmReservation,
        cancelReservation,
        lookupReservation,
        sendNotification,
        processRefund,
        generateMonthlySettlements,
        updateSettlementStatus,
        googleUser,
        googleToken,
        isGoogleConnected: !!googleUser && !!googleToken,
        connectGoogle,
        disconnectGoogle,
        driveSyncStatus,
        sheetSyncStatus,
        syncDriveAuditLogs,
        fetchDriveAuditLogs,
        syncGoogleSheetReservations,
        resetToDefaultData,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
