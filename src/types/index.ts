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
  | 'homeroom_teachers'   // Tất cả 53 Giáo viên chủ nhiệm (cả 3 điểm trường)
  | 'gvcn_diem_chinh'     // GVCN Điểm chính (14 lớp THPT: 10CB, 11CB, 12CB)
  | 'gvcn_doc_binh_kieu'  // GVCN Điểm Đốc Binh Kiều (24 lớp THCS: K6 - K9)
  | 'gvcn_tan_kieu'       // GVCN Điểm Tân Kiều (15 lớp THCS: K6 - K9)
  | 'dept_heads_only'     // Chỉ 19 Tổ trưởng & Tổ phó chuyên môn
  | 'teachers_only'       // Chỉ Giáo viên bộ môn (không tính NV VP)
  | 'staff_only'          // Chỉ Nhân viên văn phòng
  | 'specific_users';     // Chỉ định danh sách cá nhân / Thầy Cô cụ thể

export type FormFieldType = 
  | 'text'        // Trả lời ngắn (Short answer)
  | 'textarea'    // Đoạn văn (Paragraph)
  | 'radio'       // Trắc nghiệm (Multiple choice - Chọn 1)
  | 'checkbox'    // Hộp kiểm (Checkboxes - Chọn nhiều)
  | 'dropdown'    // Menu thả xuống (Dropdown)
  | 'select'      // Danh sách chọn (Alias)
  | 'number'      // Số liệu (Number)
  | 'scale'       // Thang đo tuyến tính (Linear scale 1-5 / 1-10)
  | 'date'        // Ngày (Date)
  | 'time'        // Giờ (Time)
  | 'file'        // Tải tệp lên (File upload)
  | 'section'     // Phân đoạn / Tiêu đề mục (Section header)
  | 'table';      // Bảng số liệu

export interface CustomFormField {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  description?: string; // Mô tả phụ / hướng dẫn bên dưới câu hỏi (như Google Form)
  options?: string[]; // Danh sách đáp án cho trắc nghiệm / hộp kiểm / dropdown
  allowOther?: boolean; // Tùy chọn 'Khác...'
  scaleMin?: number; // Thang đo tối thiểu (thường là 1)
  scaleMax?: number; // Thang đo tối đa (ví dụ: 5 hoặc 10)
  scaleMinLabel?: string; // Nhãn thang đo min (ví dụ: Kém / Chưa đạt)
  scaleMaxLabel?: string; // Nhãn thang đo max (ví dụ: Xuất sắc / Rất tốt)
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
  targetAudience?: TargetAudienceType; // Phân nhóm đối tượng nộp báo cáo (GVCN, Tổ trưởng, toàn trường, cá nhân cụ thể...)
  targetUserIds?: string[]; // Danh sách ID các Thầy Cô được chỉ định đích danh khi targetAudience === 'specific_users'
  isRequired: boolean;
  status: 'active' | 'closed' | 'upcoming' | 'completed';
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
    departmentMeetingMinutes?: DepartmentMeetingMinutesData;
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
  lateWaived?: boolean; // BGH miễn trừ nộp trễ do sự cố mạng/hệ thống
  lateWaivedBy?: string;
  
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
  logoUrl?: string; // URL hoặc data base64 ảnh logo nhà trường
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

// ----------------------------------------------------
// BÁO CÁO TỔ TRƯỞNG CHUYÊN MÔN: BIÊN BẢN SINH HOẠT TỔ CHUYÊN MÔN
// ----------------------------------------------------
export interface DepartmentMeetingMinutesData {
  departmentName: string;        // e.g. "TOÁN - TIN", "NGỮ VĂN", "KHTN"...
  meetingNumber: string;         // e.g. "lần 1", "lần 2"...
  academicYear: string;          // e.g. "2026 - 2027"
  timeHour: string;              // e.g. "08" hoặc "14"
  timeMinute: string;            // e.g. "00" hoặc "30"
  meetingDate: string;           // e.g. "18"
  meetingMonth: string;          // e.g. "9"
  meetingYear: string;           // e.g. "2026"
  location: string;              // e.g. "Phòng họp tổ số 1" hoặc "Phòng Hội đồng"
  totalMembers: number | string; // Tổng số thành viên của tổ
  presentMembers: number | string; // Tổng số thành viên tham dự
  absentCount: number | string;  // Vắng
  absentWithPermission: string;  // Trong đó có phép
  absentReason: string;          // Lý do
  absentWithoutPermission: string; // Không phép
  chairPerson: string;           // Họ tên Chủ trì - Tổ trưởng
  chairTitle?: string;           // "Tổ trưởng" hoặc chức vụ
  secretary: string;             // Họ tên Thư ký
  
  // 1. Đánh giá hoạt động của tổ trong thời gian qua
  reviewStrengths: string;       // Ưu điểm
  reviewWeaknesses: string;      // Hạn chế
  reviewCauses: string;          // Nguyên nhân của hạn chế
  reviewSolutions: string;       // Giải pháp khắc phục

  // 2. Triển khai các văn bản
  documentsDeployed: string;     // Triển khai các văn bản hướng dẫn chỉ đạo

  // 3. Triển khai nội dung công việc trọng tâm của trường/tổ
  centralTasks: string;          // Nội dung công việc trọng tâm
  includeGradeTable?: boolean;   // Kèm bảng số cột điểm THCS & THPT quy định

  // 4. Ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân
  memberOpinions: string;

  // 5. Kết luận của chủ trì
  conclusion: string;

  // 6. Đề xuất, kiến nghị với nhà trường
  recommendations: string;

  // Kết thúc
  endHour?: string;
  endMinute?: string;
}


