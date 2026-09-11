import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService, ADMIN_MASTER_PASSWORD_DEFAULT } from '../services/storage';
import { getFirebaseInstance } from '../services/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  isAuthenticated: boolean;
  isImpersonating: boolean;
  originalAdminId: string | null;
  canSwitchUser: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  returnToAdmin: () => void;
  changePassword: (newPassword: string) => boolean;
  resetUserPassword: (targetUserId: string) => { success: boolean; message: string };
  setCurrentUser: (user: User) => void;
  switchUser: (userId: string) => void;
  switchRoleQuick: (role: UserRole) => void;
  updateUserProfile: (updated: Partial<User>) => void;
  isAdmin: boolean;
  isPrincipal: boolean;
  isDeptHead: boolean;
  isTeacher: boolean;
  canApproveDept: (deptId?: string) => boolean;
  canApprovePrincipal: boolean;
  canManagePeriods: boolean;
  canExportAll: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'dbk_active_user_id';
const AUTH_STATUS_KEY = 'dbk_is_authenticated';
const IMPERSONATING_KEY = 'dbk_impersonating_admin';
const ORIGINAL_ADMIN_KEY = 'dbk_original_admin_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());

  // Strictly require authenticated = true; never default to true!
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem(AUTH_STATUS_KEY);
    return savedAuth === 'true';
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const savedAuth = localStorage.getItem(AUTH_STATUS_KEY);
    if (savedAuth !== 'true') return '';
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved || '';
  });

  const [isImpersonating, setIsImpersonating] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem(AUTH_STATUS_KEY);
    if (savedAuth !== 'true') return false;
    return localStorage.getItem(IMPERSONATING_KEY) === 'true';
  });

  const [originalAdminId, setOriginalAdminId] = useState<string | null>(() => {
    const savedAuth = localStorage.getItem(AUTH_STATUS_KEY);
    if (savedAuth !== 'true') return null;
    return localStorage.getItem(ORIGINAL_ADMIN_KEY);
  });

  // Background sync credentials on mount
  useEffect(() => {
    const syncCredentialsOnMount = async () => {
      try {
        const { db, isReady } = getFirebaseInstance();
        if (isReady && db) {
          const snap = await getDocs(collection(db, 'user_credentials'));
          if (!snap.empty) {
            const localCreds = StorageService.getUserCredentials();
            let hasChanges = false;
            snap.forEach(docSnap => {
              const data = docSnap.data();
              if (data && data.password) {
                if (!localCreds[docSnap.id] || localCreds[docSnap.id].password !== data.password) {
                  localCreds[docSnap.id] = {
                    userId: docSnap.id,
                    password: data.password,
                    hasChangedPassword: data.hasChangedPassword ?? true,
                    mustChangePassword: data.mustChangePassword ?? false,
                    updatedAt: data.updatedAt || new Date().toISOString()
                  };
                  hasChanges = true;
                }
              }
            });
            if (hasChanges) {
              StorageService.saveUserCredential('staff-2', localCreds['staff-2'] || {});
              setUsers(StorageService.getUsers());
            }
          }
        }
      } catch (e) {
        console.warn('Initial credentials sync notice:', e);
      }
    };
    syncCredentialsOnMount();
  }, []);

  const currentUser: User = users.find(u => u.id === currentUserId) || users.find(u => u.id === 'staff-2') || users[0] || {
    id: 'staff-2',
    orderNo: 2,
    name: 'Nguyễn Minh Trí',
    email: 'nmtri.c3docbinhkieu.dtp@moet.edu.vn',
    role: 'admin',
    roleTitle: 'Phó Hiệu trưởng (Quản trị hệ thống)',
    departmentId: 'bgh',
    departmentName: 'Ban Giám Hiệu',
    isActive: true
  };

  const login = async (identifier: string, password = ''): Promise<{ success: boolean; message: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanPass) {
      return {
        success: false,
        message: 'Vui lòng nhập mật khẩu để đăng nhập!'
      };
    }

    // Refresh users
    const currentUsers = StorageService.getUsers();
    setUsers(currentUsers);

    // Match by email, staff ID (e.g. staff-2), orderNo, or exact name
    const foundUser = currentUsers.find(u => 
      u.email.toLowerCase() === cleanId ||
      u.id.toLowerCase() === cleanId ||
      `tt${u.orderNo}` === cleanId ||
      `cbgv${u.orderNo}` === cleanId ||
      u.name.toLowerCase() === cleanId
    );

    if (!foundUser) {
      return { 
        success: false, 
        message: 'Không tìm thấy tài khoản cán bộ/giáo viên. Vui lòng kiểm tra lại email hoặc họ tên.' 
      };
    }

    // Fetch up-to-date credentials (local and try Firestore doc)
    const creds = StorageService.getUserCredentials();
    let adminPass = creds['staff-2']?.password || ADMIN_MASTER_PASSWORD_DEFAULT;

    try {
      const { db, isReady } = getFirebaseInstance();
      if (isReady && db) {
        // Live verify target user doc
        const userDoc = await getDoc(doc(db, 'user_credentials', foundUser.id));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          if (uData?.password) {
            creds[foundUser.id] = {
              userId: foundUser.id,
              password: uData.password,
              hasChangedPassword: uData.hasChangedPassword ?? true,
              mustChangePassword: uData.mustChangePassword ?? false,
              updatedAt: uData.updatedAt || new Date().toISOString()
            };
            StorageService.saveUserCredential(foundUser.id, creds[foundUser.id]);
          }
        }
        // Live verify admin doc if needed
        const adminDoc = await getDoc(doc(db, 'user_credentials', 'staff-2'));
        if (adminDoc.exists() && adminDoc.data()?.password) {
          adminPass = adminDoc.data().password;
          creds['staff-2'] = {
            userId: 'staff-2',
            password: adminPass,
            hasChangedPassword: true,
            mustChangePassword: false,
            updatedAt: adminDoc.data().updatedAt || new Date().toISOString()
          };
          StorageService.saveUserCredential('staff-2', creds['staff-2']);
        }
      }
    } catch (e) {
      console.warn('Live cred fetch notice:', e);
    }

    // 1. Check if logging into Admin account (staff-2 or admin role)
    const isTargetAdmin = foundUser.id === 'staff-2' || foundUser.role === 'admin';
    if (isTargetAdmin) {
      if (cleanPass !== adminPass) {
        return {
          success: false,
          message: 'Mật khẩu Quản trị viên không chính xác! Vui lòng kiểm tra lại.'
        };
      }

      // Successful Admin login
      setCurrentUserId(foundUser.id);
      setIsAuthenticated(true);
      setIsImpersonating(false);
      setOriginalAdminId(null);
      localStorage.setItem(CURRENT_USER_KEY, foundUser.id);
      localStorage.setItem(AUTH_STATUS_KEY, 'true');
      localStorage.removeItem(IMPERSONATING_KEY);
      localStorage.removeItem(ORIGINAL_ADMIN_KEY);

      return {
        success: true,
        message: `Đăng nhập thành công! Kính chào Quản trị viên ${foundUser.name}.`
      };
    }

    // 2. Regular teacher account
    // Check: Did Admin log in using Admin Master Password?
    // "Riêng tôi là quản trị thì tôi muốn vào của ai thì vào"
    if (cleanPass === adminPass) {
      setCurrentUserId(foundUser.id);
      setIsAuthenticated(true);
      setIsImpersonating(true);
      setOriginalAdminId('staff-2');
      localStorage.setItem(CURRENT_USER_KEY, foundUser.id);
      localStorage.setItem(AUTH_STATUS_KEY, 'true');
      localStorage.setItem(IMPERSONATING_KEY, 'true');
      localStorage.setItem(ORIGINAL_ADMIN_KEY, 'staff-2');

      return {
        success: true,
        message: `Đăng nhập thành công với Đặc quyền Quản trị viên (Đang truy cập tài khoản: ${foundUser.name}).`
      };
    }

    // 3. Regular teacher logging in with their own password
    const userCred = creds[foundUser.id];
    const userPass = userCred?.password || foundUser.password;
    const isLocallyChanged = localStorage.getItem(`dbk_pwd_changed_${foundUser.id}`) === 'true';
    const hasChanged = Boolean(userCred?.hasChangedPassword || foundUser.hasChangedPassword || isLocallyChanged);

    if (hasChanged && userPass) {
      // Must match custom password
      if (cleanPass !== userPass) {
        return {
          success: false,
          message: 'Mật khẩu không chính xác! Vui lòng nhập đúng mật khẩu cá nhân của Thầy/Cô hoặc liên hệ Quản trị viên để đặt lại.'
        };
      }
    } else {
      // Must match initial default password
      if (cleanPass !== '123456') {
        return {
          success: false,
          message: 'Mật khẩu không chính xác! Mật khẩu khởi tạo ban đầu cho tài khoản chưa đổi là 123456.'
        };
      }
    }

    // Successful Teacher login
    setCurrentUserId(foundUser.id);
    setIsAuthenticated(true);
    setIsImpersonating(false);
    setOriginalAdminId(null);
    localStorage.setItem(CURRENT_USER_KEY, foundUser.id);
    localStorage.setItem(AUTH_STATUS_KEY, 'true');
    localStorage.removeItem(IMPERSONATING_KEY);
    localStorage.removeItem(ORIGINAL_ADMIN_KEY);

    return {
      success: true,
      message: `Đăng nhập thành công! Kính chào ${foundUser.roleTitle} ${foundUser.name}.`
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUserId('');
    setIsImpersonating(false);
    setOriginalAdminId(null);
    localStorage.setItem(AUTH_STATUS_KEY, 'false');
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(IMPERSONATING_KEY);
    localStorage.removeItem(ORIGINAL_ADMIN_KEY);
  };

  const returnToAdmin = () => {
    const adminId = originalAdminId || 'staff-2';
    setCurrentUserId(adminId);
    setIsImpersonating(false);
    setOriginalAdminId(null);
    localStorage.setItem(CURRENT_USER_KEY, adminId);
    localStorage.removeItem(IMPERSONATING_KEY);
    localStorage.removeItem(ORIGINAL_ADMIN_KEY);
  };

  const changePassword = (newPassword: string): boolean => {
    if (!newPassword.trim() || newPassword.length < 4) return false;
    const cleanPass = newPassword.trim();
    StorageService.saveUserCredential(currentUser.id, {
      password: cleanPass,
      hasChangedPassword: true,
      mustChangePassword: false
    });
    const updated: User = { 
      ...currentUser, 
      password: cleanPass,
      hasChangedPassword: true,
      mustChangePassword: false
    };
    const newUsers = StorageService.saveUser(updated);
    setUsers(newUsers);
    return true;
  };

  const resetUserPassword = (targetUserId: string): { success: boolean; message: string } => {
    const isActualAdmin = currentUser.role === 'admin' || currentUser.id === 'staff-2' || isImpersonating;
    if (!isActualAdmin) {
      return {
        success: false,
        message: 'Từ chối quyền hạn: Chỉ tài khoản Quản trị viên hệ thống (Admin) mới có quyền đặt lại mật khẩu cho cán bộ, giáo viên!'
      };
    }

    const res = StorageService.resetUserPasswordToDefault(targetUserId);
    if (res.success) {
      const updatedUsers = StorageService.getUsers();
      setUsers(updatedUsers);
    }
    return res;
  };

  // Only Admin or Impersonating Admin can switch users
  const canSwitchUser = (currentUser.role === 'admin' || currentUser.id === 'staff-2' || isImpersonating);

  const switchUser = (userId: string) => {
    if (!canSwitchUser) {
      console.warn('Unauthorized switch attempt: only Admin can switch users');
      return;
    }
    const target = users.find(u => u.id === userId);
    if (!target) return;

    if (target.id === 'staff-2' || target.role === 'admin') {
      returnToAdmin();
    } else {
      setIsImpersonating(true);
      setOriginalAdminId('staff-2');
      localStorage.setItem(IMPERSONATING_KEY, 'true');
      localStorage.setItem(ORIGINAL_ADMIN_KEY, 'staff-2');
      setCurrentUserId(target.id);
      localStorage.setItem(CURRENT_USER_KEY, target.id);
    }
  };

  const switchRoleQuick = (role: UserRole) => {
    if (!canSwitchUser) return;
    const target = users.find(u => u.role === role);
    if (target) {
      switchUser(target.id);
    }
  };

  const updateUserProfile = (updated: Partial<User>) => {
    if (!currentUser) return;
    const newUserData = { ...currentUser, ...updated };
    const newUsers = StorageService.saveUser(newUserData);
    setUsers(newUsers);
  };

  const isAdmin = currentUser.role === 'admin' || currentUser.id === 'staff-2';
  const isPrincipal = currentUser.role === 'principal' || isAdmin;
  const isDeptHead = currentUser.role === 'dept_head' || isAdmin;
  const isTeacher = currentUser.role === 'teacher';

  const canApproveDept = (deptId?: string) => {
    if (isAdmin) return true;
    if (currentUser.role === 'dept_head') {
      return !deptId || currentUser.departmentId === deptId;
    }
    return false;
  };

  const canApprovePrincipal = isPrincipal;
  const canManagePeriods = isAdmin || currentUser.role === 'principal';
  const canExportAll = isAdmin || currentUser.role === 'principal';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers: users,
        isAuthenticated,
        isImpersonating,
        originalAdminId,
        canSwitchUser,
        login,
        logout,
        returnToAdmin,
        changePassword,
        resetUserPassword,
        setCurrentUser: (u) => {
          setCurrentUserId(u.id);
          setIsAuthenticated(true);
        },
        switchUser,
        switchRoleQuick,
        updateUserProfile,
        isAdmin,
        isPrincipal,
        isDeptHead,
        isTeacher,
        canApproveDept,
        canApprovePrincipal,
        canManagePeriods,
        canExportAll
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
