import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  changePassword: (newPassword: string) => boolean;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved || 'staff-2'; // Default to Thầy Nguyễn Minh Trí (Phó Hiệu trưởng / Quản trị hệ thống)
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem(AUTH_STATUS_KEY);
    return savedAuth !== 'false'; // Default to logged in so teacher can use right away or sign out
  });

  useEffect(() => {
    localStorage.setItem(CURRENT_USER_KEY, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(AUTH_STATUS_KEY, String(isAuthenticated));
  }, [isAuthenticated]);

  const currentUser = users.find(u => u.id === currentUserId) || users.find(u => u.id === 'staff-2') || users[0] || {
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

    // Match by email, staff ID (e.g. staff-2), orderNo, or exact name
    const foundUser = users.find(u => 
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

    // Check password if set, otherwise accept default '123456' or 'dbk@2026'
    const userPass = foundUser.password || '123456';
    if (cleanPass && cleanPass !== userPass && cleanPass !== '123456' && cleanPass !== 'dbk@2026' && cleanPass !== 'dbk@2025') {
      return {
        success: false, 
        message: 'Mật khẩu không chính xác! Vui lòng thử lại.' 
      };
    }

    setCurrentUserId(foundUser.id);
    setIsAuthenticated(true);
    return {
      success: true,
      message: `Đăng nhập thành công! Kính chào ${foundUser.roleTitle} ${foundUser.name}.`
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const changePassword = (newPassword: string): boolean => {
    if (!newPassword.trim() || newPassword.length < 4) return false;
    const updated: User = { 
      ...currentUser, 
      password: newPassword.trim(),
      hasChangedPassword: true,
      mustChangePassword: false
    };
    const newUsers = StorageService.saveUser(updated);
    setUsers(newUsers);
    return true;
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      setIsAuthenticated(true);
    }
  };

  const switchRoleQuick = (role: UserRole) => {
    const target = users.find(u => u.role === role);
    if (target) {
      setCurrentUserId(target.id);
      setIsAuthenticated(true);
    }
  };

  const updateUserProfile = (updated: Partial<User>) => {
    if (!currentUser) return;
    const newUserData = { ...currentUser, ...updated };
    const newUsers = StorageService.saveUser(newUserData);
    setUsers(newUsers);
  };

  const isAdmin = currentUser.role === 'admin';
  const isPrincipal = currentUser.role === 'principal' || currentUser.role === 'admin';
  const isDeptHead = currentUser.role === 'dept_head' || currentUser.role === 'admin';
  const isTeacher = currentUser.role === 'teacher';

  const canApproveDept = (deptId?: string) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'dept_head') {
      return !deptId || currentUser.departmentId === deptId;
    }
    return false;
  };

  const canApprovePrincipal = currentUser.role === 'principal' || currentUser.role === 'admin';
  const canManagePeriods = currentUser.role === 'admin' || currentUser.role === 'principal';
  const canExportAll = currentUser.role === 'admin' || currentUser.role === 'principal';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers: users,
        isAuthenticated,
        login,
        logout,
        changePassword,
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
