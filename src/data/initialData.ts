import { User, Department, ReportPeriod, ReportSubmission, SchoolInfo, AppNotification } from '../types';
import { OFFICIAL_DEPARTMENTS, OFFICIAL_USERS } from './staffRoster';

export const INITIAL_SCHOOL_INFO: SchoolInfo = {
  name: 'THCS & THPT Đốc Binh Kiều',
  formalName: 'TRƯỜNG TRUNG HỌC CƠ SỞ & TRUNG HỌC PHỔ THÔNG ĐỐC BINH KIỀU',
  departmentOfEducation: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG THÁP',
  address: 'Xã Đốc Binh Kiều, Huyện Tháp Mười, Tỉnh Đồng Tháp',
  phone: '0277 3824 115',
  email: 'c3docbinhkieu.dtp@moet.edu.vn',
  website: 'thcs-thptdocbinhkieu.dongthap.edu.vn',
  principalName: 'Thầy Lê Thanh Cường',
  vicePrincipals: ['Thầy Nguyễn Minh Trí', 'Thầy Phan Thanh Thảo', 'Thầy Nguyễn Thanh Tòng']
};

export const INITIAL_DEPARTMENTS: Department[] = OFFICIAL_DEPARTMENTS;
export const INITIAL_USERS: User[] = OFFICIAL_USERS;

export const INITIAL_PERIODS: ReportPeriod[] = [];

export const INITIAL_SUBMISSIONS: ReportSubmission[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

