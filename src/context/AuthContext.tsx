import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved || 'staff-1'; // Default to Thầy Lê Thanh Cường (Hiệu trưởng)
  });

  useEffect(() => {
    localStorage.setItem(CURRENT_USER_KEY, currentUserId);
  }, [currentUserId]);

  const currentUser = users.find(u => u.id === currentUserId) || users.find(u => u.id === 'staff-1') || users[0] || {
    id: 'staff-1',
    orderNo: 1,
    name: 'Lê Thanh Cường',
    email: 'ltcuong.c3docbinhkieu.dtp@moet.edu.vn',
    role: 'principal',
    roleTitle: 'Hiệu trưởng',
    departmentId: 'bgh',
    departmentName: 'Ban Giám Hiệu',
    isActive: true
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
    }
  };

  const switchRoleQuick = (role: UserRole) => {
    const target = users.find(u => u.role === role);
    if (target) {
      setCurrentUserId(target.id);
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
        setCurrentUser: (u) => setCurrentUserId(u.id),
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
