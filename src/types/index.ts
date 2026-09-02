export type UserRole = 'admin' | 'principal' | 'dept_head' | 'teacher';

export interface User {
  id: string;
  orderNo?: number;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string; // e.g. "Hiệu trưởng", "Phó Hiệu trưởng", "Tổ trưởng", "Tổ phó", "Giáo viên", "Nhân viên"
  departmentId: string;
  departmentName: string;
  originalSchool?: string; // THPTĐBK, THCSĐBK, THCSTK
  dateOfBirth?: string;
  gender?: 'Nam' | 'Nữ' | string;
  subject?: string; // Môn dạy hoặc công tác
  partyMember?: boolean; // Đảng viên
  positionBefore?: string;
  positionAfter?: string;
  qualification?: string; // Trình độ chuyên môn cao nhất (Thạc sỹ, ĐHSP, Đại học, Cao đẳng, Trung cấp, Kỹ sư...)
  specialization?: string; // Chuyên ngành đào tạo
  politicalTheory?: string; // Trình độ LLCT (Cao cấp, Trung cấp, Sơ cấp)
  itSkill?: string; // Trình độ tin học
  foreignLanguage?: string; // Trình độ ngoại ngữ
  managementDegree?: string; // Trình độ quản lý GD / Quản lý nhà nước
  
  // Giáo viên chủ nhiệm (GVCN)
  isHomeroomTeacher?: boolean;
  homeroomClass?: string; // e.g. "12CB1", "6A1", "9A10"
  homeroomCampus?: 'THPT' | 'DBK' | 'TK' | string; // Điểm trường
  homeroomStudentCount?: number; // Sĩ số
  homeroomGrade?: number; // Khối: 6, 7, 8, 9, 10, 11, 12

  avatarUrl?: string;
  phone?: string;
  password?: string;
  hasChangedPassword?: boolean;
  mustChangePassword?: boolean;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headUserId: string;
  headUserName: string;
  description?: string;
  memberCount?: number;
}

export type ReportType = 'text_only' | 'with_attachment' | 'hybrid';

export type SubmissionStatus = 
  | 'draft'               // Bản nháp chưa gửi
  | 'submitted'           // Đã gửi - Chờ tổ trưởng duyệt
  | 'dept_approved'       // Tổ trưởng đã duyệt - Chuyển Ban giám hiệu
  | 'dept_rejected'       // Tổ trưởng từ chối / trả lại yêu cầu sửa
  | 'principal_approved'  // Ban giám hiệu đã phê duyệt hoàn tất
  | 'principal_rejected'; // Ban giám hiệu yêu cầu bổ sung

export interface ReportAttachment {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // mime or extension
  url: string; // base64 or storage url
  uploadedAt: string;
}

export type TargetAudienceType = 
  | 'all'                 // Tất cả 120 cán bộ, GV, NV
  | 'homeroom_teachers'   // Chỉ 53 Giáo viên chủ nhiệm (GVCN)
  | 'dept_heads_only'     // Chỉ Tổ trưởng / Tổ phó
  | 'teachers_only'       // Chỉ Giáo viên bộ môn (không tính NV VP)
  | 'staff_only';         // Chỉ Nhân viên văn phòng

export interface CustomFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'table';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  tableColumns?: string[]; // for table type: e.g. ["STT", "Họ và tên", "Nhiệm vụ", "Kết quả"]
  tableRows?: Record<string, string>[];
}

export interface CustomDynamicTable {
  id: string;
  title: string;
  headers: string[];
  rows: Record<string, string>[];
}

export interface PeriodFormTemplate {
  defaultTemplateContent?: string;
  fields?: CustomFormField[];
  tables?: CustomDynamicTable[];
}

export interface ReportPeriod {
  id: string;
  title: string;
  description: string;
  academicYear: string; // "2026-2027"
  semester: 'HK1' | 'HK2' | 'Ca_Nam' | 'He';
  startDate: string; // ISO string
  deadline: string; // ISO string
  reportType: ReportType;
  allowedFileTypes?: string[]; // e.g. ['.pdf', '.docx', '.xlsx', '.pptx', '.zip', '.rar', '.png', '.jpg']
  maxFileSizeMb?: number;
  targetDepartmentIds: string[]; // ['all'] or specific departments
  targetRoles: UserRole[]; // Which roles need to submit
  targetAudience?: TargetAudienceType; // Phân nhóm đối tượng nộp báo cáo (GVCN, Tổ trưởng, toàn trường...)
  isRequired: boolean;
  status: 'active' | 'closed' | 'upcoming';
  createdBy: string;
  createdAt: string;
  defaultTemplateContent?: string;
  formTemplate?: PeriodFormTemplate;
}

export interface ReviewHistory {
  id: string;
  reviewedBy: string;
  reviewerName: string;
  reviewerRole: UserRole;
  reviewerRoleTitle: string;
  action: 'approved' | 'rejected' | 'forwarded' | 'requested_edit';
  comment: string;
  timestamp: string;
}

export interface ReportSubmission {
  id: string;
  periodId: string;
  periodTitle: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  authorRoleTitle: string;
  departmentId: string;
  departmentName: string;
  
  // Dành cho báo cáo GVCN
  isHomeroomReport?: boolean;
  homeroomClass?: string;
  homeroomStudentCount?: number;
  homeroomCampus?: string;

  title: string;
  content: string; // Rich text / structured markdown / text
  structuredData?: {
    homeroomMinutes?: HomeroomMeetingMinutesData;
    [key: string]: any;
  };
  attachments: ReportAttachment[];
  
  status: SubmissionStatus;
  
  submittedAt: string | null;
  updatedAt: string;
  
  // Deadline & Late tracking
  isLate: boolean;
  lateDurationMinutes?: number; // Minutes submitted after deadline
  lateExplanation?: string;
  
  // Review records
  deptHeadReview?: ReviewHistory;
  principalReview?: ReviewHistory;
  reviewHistory: ReviewHistory[];
  
  // Versioning
  version: number;
}

export interface AppNotification {
  id: string;
  userId: string; // 'all' or specific user ID
  title: string;
  message: string;
  type: 'deadline_alert' | 'review_approved' | 'review_rejected' | 'new_period' | 'system';
  linkId?: string; // Report ID or Period ID
  isRead: boolean;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'queued';
  type: 'deadline_reminder' | 'overdue_alert' | 'review_result' | 'general_announcement';
}

export interface SchoolInfo {
  name: string;
  formalName: string;
  departmentOfEducation: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  principalName: string;
  vicePrincipals: string[];
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
  isConfigured: boolean;
}

// ----------------------------------------------------
// BÁO CÁO GIÁO VIÊN CHỦ NHIỆM: BIÊN BẢN TẬP TRUNG ĐẦU NĂM HỌC
// ----------------------------------------------------
export interface TalentAchievementItem {
  id: string;
  tt?: number;
  competition: string;
  prize: string;
  studentName: string;
  note?: string;
}

export interface ClassCadreItem {
  id: string;
  tt?: number;
  role: string;
  studentName: string;
  academicPerf: string; // Tốt / Khá / Đạt / Giỏi...
  conductPerf: string;  // Tốt / Khá / Đạt...
  phone: string;
}

export interface AbsentStudentItem {
  id: string;
  tt?: number;
  studentName: string;
  previousClass: string;
  currentAddress: string;
  studentPhone: string;
  parentPhone: string;
  reason: string;
}

export interface HomeroomMeetingMinutesData {
  academicYear: string; // "2026 – 2027"
  timeHour: string;      // e.g. "07"
  timeMinute: string;    // e.g. "30"
  meetingDate: string;   // e.g. "28"
  meetingMonth: string;  // e.g. "8"
  meetingYear: string;   // e.g. "2026"
  roomNumber: string;    // e.g. "12" hoặc "Phòng 10"
  teacherName: string;
  className: string;
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  absentCount?: number;
  talents: TalentAchievementItem[];
  cadres: ClassCadreItem[];
  absentStudents: AbsentStudentItem[];
  additionalNotes?: string;
}

