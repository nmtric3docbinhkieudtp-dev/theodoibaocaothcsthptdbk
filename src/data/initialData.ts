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

export const INITIAL_PERIODS: ReportPeriod[] = [
  {
    id: 'period-1',
    title: 'Báo cáo sơ kết công tác chuyên môn & Kiểm tra định kỳ giữa HK1',
    description: 'Báo cáo thống kê phân tích điểm số, đánh giá chất lượng dạy học theo chương trình GDPT 2018 và đề xuất giải pháp phụ đạo.',
    academicYear: '2025-2026',
    semester: 'HK1',
    startDate: '2026-08-15T07:00:00.000Z',
    deadline: '2026-09-05T17:00:00.000Z', // Coming soon
    reportType: 'hybrid',
    allowedFileTypes: ['.pdf', '.docx', '.xlsx', '.zip'],
    maxFileSizeMb: 25,
    targetDepartmentIds: ['all'],
    targetRoles: ['teacher', 'dept_head'],
    isRequired: true,
    status: 'active',
    createdBy: 'Thầy Lê Thanh Cường (Hiệu trưởng)',
    createdAt: '2026-08-15T07:00:00.000Z'
  },
  {
    id: 'period-2',
    title: 'Báo cáo công tác bồi dưỡng Học sinh giỏi cấp Tỉnh và Phụ đạo yếu kém',
    description: 'Tổng hợp danh sách đội tuyển dự thi cấp Tỉnh, giáo án bồi dưỡng, lịch dạy tăng cường và kết quả khảo sát tháng 8.',
    academicYear: '2025-2026',
    semester: 'HK1',
    startDate: '2026-08-20T07:00:00.000Z',
    deadline: '2026-09-02T23:59:59.000Z', // Due in ~2 days
    reportType: 'with_attachment',
    allowedFileTypes: ['.docx', '.xlsx', '.pdf'],
    maxFileSizeMb: 20,
    targetDepartmentIds: ['toan', 'ngu_van_tv_tb', 'khtn_cn', 'su_dia_gdcd', 'nn_tin'],
    targetRoles: ['teacher', 'dept_head'],
    isRequired: true,
    status: 'active',
    createdBy: 'Thầy Nguyễn Minh Trí (Phó Hiệu trưởng)',
    createdAt: '2026-08-20T07:00:00.000Z'
  },
  {
    id: 'period-3',
    title: 'Báo cáo công tác chủ nhiệm & Quản lý nền nếp học sinh tháng 8',
    description: 'Nộp nhận xét tình hình chuyên cần, học sinh có hoàn cảnh khó khăn, các hoạt động Đoàn Đội và phối hợp phụ huynh.',
    academicYear: '2025-2026',
    semester: 'HK1',
    startDate: '2026-08-10T07:00:00.000Z',
    deadline: '2026-08-28T17:00:00.000Z', // Past deadline
    reportType: 'text_only',
    targetDepartmentIds: ['all'],
    targetRoles: ['teacher'],
    isRequired: true,
    status: 'closed',
    createdBy: 'Ban Giám Hiệu',
    createdAt: '2026-08-10T07:00:00.000Z'
  },
  {
    id: 'period-4',
    title: 'Báo cáo chuyên đề đổi mới phương pháp dạy học & Kế hoạch bài dạy (STEM)',
    description: 'Mỗi tổ chuyên môn nộp ít nhất 02 chuyên đề dạy học tích hợp STEM và bài giảng điện tử minh họa.',
    academicYear: '2025-2026',
    semester: 'HK1',
    startDate: '2026-08-25T07:00:00.000Z',
    deadline: '2026-09-15T17:00:00.000Z',
    reportType: 'with_attachment',
    allowedFileTypes: ['.pdf', '.docx', '.pptx', '.zip', '.rar'],
    maxFileSizeMb: 50,
    targetDepartmentIds: ['toan', 'ngu_van_tv_tb', 'khtn_cn', 'su_dia_gdcd', 'nn_tin', 'gdtc_qp_nt'],
    targetRoles: ['dept_head', 'teacher'],
    isRequired: false,
    status: 'active',
    createdBy: 'Thầy Phan Thanh Thảo (Phó Hiệu trưởng)',
    createdAt: '2026-08-25T07:00:00.000Z'
  }
];

export const INITIAL_SUBMISSIONS: ReportSubmission[] = [
  {
    id: 'sub-1',
    periodId: 'period-1',
    periodTitle: 'Báo cáo sơ kết công tác chuyên môn & Kiểm tra định kỳ giữa HK1',
    authorId: 'staff-22',
    authorName: 'Trần Văn Giang',
    authorEmail: 'tvgiang.c3docbinhkieu.dtp@moet.edu.vn',
    authorRole: 'teacher',
    authorRoleTitle: 'Giáo viên Toán (CN Lớp 10A1)',
    departmentId: 'toan',
    departmentName: 'Tổ Toán',
    title: 'Báo cáo kết quả kiểm tra định kỳ môn Toán khối 10 & Lớp 10A1',
    content: `Kính gửi Ban Giám Hiệu và Tổ trưởng Tổ Toán,

Tôi xin báo cáo kết quả kiểm tra chất lượng định kỳ môn Toán khối 10 như sau:
1. Tổng số học sinh tham gia: 42/42 em (100%).
2. Thống kê kết quả:
- Điểm Giỏi (8.0 - 10.0): 14 em (33.3%)
- Điểm Khá (6.5 - 7.9): 18 em (42.8%)
- Điểm Trung bình (5.0 - 6.4): 8 em (19.0%)
- Điểm Yếu (< 5.0): 2 em (4.7%) (Học sinh Nguyễn Văn An, Trần Văn Bình).

3. Đánh giá chung:
- Học sinh nắm tốt phần đại số mệnh đề và tập hợp, các dạng toán hàm số bậc hai.
- Một số em còn lúng túng ở phần bài toán thực tế cực trị và hệ bất phương trình bậc nhất hai ẩn.

4. Đề xuất:
- Tổ chức 02 buổi phụ đạo tăng cường vào chiều thứ 4 và thứ 6 cho nhóm học sinh dưới trung bình.
- Tổ chức câu lạc bộ Toán ứng dụng giải toán trên máy tính cầm tay Casio.`,
    attachments: [
      {
        id: 'att-1',
        name: 'Bang_Diem_Chi_Tiet_Toan_10A1.xlsx',
        size: 145200,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: '#',
        uploadedAt: '2026-08-27T08:30:00.000Z'
      },
      {
        id: 'att-2',
        name: 'De_Va_Dap_An_Kiem_Tra_Dinh_Ky.pdf',
        size: 384500,
        type: 'application/pdf',
        url: '#',
        uploadedAt: '2026-08-27T08:31:00.000Z'
      }
    ],
    status: 'dept_approved',
    submittedAt: '2026-08-27T08:35:00.000Z',
    updatedAt: '2026-08-28T09:15:00.000Z',
    isLate: false,
    deptHeadReview: {
      id: 'rev-1',
      reviewedBy: 'staff-19',
      reviewerName: 'Nguyễn Văn Tới',
      reviewerRole: 'dept_head',
      reviewerRoleTitle: 'Tổ trưởng Toán',
      action: 'approved',
      comment: 'Báo cáo chi tiết, số liệu chuẩn xác, kế hoạch phụ đạo rất thiết thực. Đồng ý duyệt và chuyển Ban Giám Hiệu phê duyệt.',
      timestamp: '2026-08-28T09:15:00.000Z'
    },
    reviewHistory: [
      {
        id: 'rev-1',
        reviewedBy: 'staff-19',
        reviewerName: 'Nguyễn Văn Tới',
        reviewerRole: 'dept_head',
        reviewerRoleTitle: 'Tổ trưởng Toán',
        action: 'approved',
        comment: 'Báo cáo chi tiết, số liệu chuẩn xác, kế hoạch phụ đạo rất thiết thực. Đồng ý duyệt và chuyển Ban Giám Hiệu phê duyệt.',
        timestamp: '2026-08-28T09:15:00.000Z'
      }
    ],
    version: 1
  },
  {
    id: 'sub-2',
    periodId: 'period-3',
    periodTitle: 'Báo cáo công tác chủ nhiệm & Quản lý nền nếp học sinh tháng 8',
    authorId: 'staff-23',
    authorName: 'Lê Cao Toàn',
    authorEmail: 'lctoan.c3docbinhkieu.dtp@moet.edu.vn',
    authorRole: 'teacher',
    authorRoleTitle: 'Giáo viên Chủ nhiệm lớp 11B2',
    departmentId: 'toan',
    departmentName: 'Tổ Toán',
    title: 'Báo cáo tình hình chủ nhiệm và chuyên cần lớp 11B2 tháng 8/2026',
    content: `Báo cáo tình hình tháng 8/2026 của lớp 11B2:
1. Sĩ số: Đầu năm 38 em (Nam 20, Nữ 18), duy trì 100%, không có học sinh bỏ học.
2. Học tập: Các em bắt nhịp nhanh với chương trình SGK mới lớp 11.
3. Nền nếp, kỷ cương:
- Học sinh thực hiện nghiêm túc đồng phục, bảng tên, quy định không sử dụng điện thoại di động trong giờ học khi chưa có sự cho phép của giáo viên.
- Tham gia đầy đủ các buổi sinh hoạt dưới cờ và lao động vệ sinh khuôn viên trường.
4. Hoàn cảnh đặc biệt:
- Có 02 học sinh thuộc diện hộ nghèo/cận nghèo đã được nhà trường hỗ trợ sách giáo khoa.
5. Kiến nghị:
- Đề xuất nhà trường sửa chữa quạt trần tại phòng học số 12 (dãy A).`,
    attachments: [],
    status: 'principal_approved',
    submittedAt: '2026-08-29T10:15:00.000Z',
    updatedAt: '2026-08-30T14:20:00.000Z',
    isLate: true,
    lateDurationMinutes: 1035,
    lateExplanation: 'Tôi gặp sự cố mất điện và kết nối mạng tại địa bàn trong ngày 28/8, xin gửi báo cáo bổ sung vào sáng 29/8.',
    deptHeadReview: {
      id: 'rev-2',
      reviewedBy: 'staff-19',
      reviewerName: 'Nguyễn Văn Tới',
      reviewerRole: 'dept_head',
      reviewerRoleTitle: 'Tổ trưởng Toán',
      action: 'approved',
      comment: 'Thầy Toàn nộp trễ do nguyên nhân khách quan đã giải trình rõ. Báo cáo lớp 11B2 tốt. Đề xuất chuyển BGH.',
      timestamp: '2026-08-29T11:00:00.000Z'
    },
    principalReview: {
      id: 'rev-3',
      reviewedBy: 'staff-1',
      reviewerName: 'Lê Thanh Cường',
      reviewerRole: 'principal',
      reviewerRoleTitle: 'Hiệu trưởng',
      action: 'approved',
      comment: 'Đã tiếp nhận và phê duyệt. Giao Tổ Văn phòng & Thiết bị kiểm tra sửa chữa quạt phòng 12 trước ngày 02/09.',
      timestamp: '2026-08-30T14:20:00.000Z'
    },
    reviewHistory: [
      {
        id: 'rev-2',
        reviewedBy: 'staff-19',
        reviewerName: 'Nguyễn Văn Tới',
        reviewerRole: 'dept_head',
        reviewerRoleTitle: 'Tổ trưởng Toán',
        action: 'approved',
        comment: 'Thầy Toàn nộp trễ do nguyên nhân khách quan đã giải trình rõ. Báo cáo lớp 11B2 tốt. Đề xuất chuyển BGH.',
        timestamp: '2026-08-29T11:00:00.000Z'
      },
      {
        id: 'rev-3',
        reviewedBy: 'staff-1',
        reviewerName: 'Lê Thanh Cường',
        reviewerRole: 'principal',
        reviewerRoleTitle: 'Hiệu trưởng',
        action: 'approved',
        comment: 'Đã tiếp nhận và phê duyệt. Giao Tổ Văn phòng & Thiết bị kiểm tra sửa chữa quạt phòng 12 trước ngày 02/09.',
        timestamp: '2026-08-30T14:20:00.000Z'
      }
    ],
    version: 1
  },
  {
    id: 'sub-3',
    periodId: 'period-2',
    periodTitle: 'Báo cáo công tác bồi dưỡng Học sinh giỏi cấp Tỉnh và Phụ đạo yếu kém',
    authorId: 'staff-38',
    authorName: 'Lê Thị Mỹ Ny',
    authorEmail: 'ltmny.c3docbinhkieu.dtp@moet.edu.vn',
    authorRole: 'teacher',
    authorRoleTitle: 'Giáo viên Ngữ văn',
    departmentId: 'ngu_van_tv_tb',
    departmentName: 'Tổ Ngữ văn - Thư viện - Thiết bị',
    title: 'Kế hoạch bồi dưỡng đội tuyển Học sinh giỏi môn Ngữ Văn lớp 12',
    content: `Báo cáo kế hoạch bồi dưỡng HSG cấp tỉnh năm học 2025-2026:
- Danh sách đội tuyển: 05 học sinh xuất sắc khối 12.
- Thời lượng: 03 buổi/tuần (Thứ 2, Thứ 4, Thứ 7).
- Chuyên đề trọng tâm: Nghị luận văn học hiện đại Việt Nam và Kỹ năng phân tích đề thi học sinh giỏi các năm.
- Mục tiêu: Đạt ít nhất 02 giải Ba và 01 giải Khuyến khích cấp Tỉnh.`,
    attachments: [
      {
        id: 'att-3',
        name: 'Giao_An_Boi_Duong_HSG_Van12.docx',
        size: 2150000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: '#',
        uploadedAt: '2026-08-30T15:00:00.000Z'
      }
    ],
    status: 'dept_rejected',
    submittedAt: '2026-08-30T15:05:00.000Z',
    updatedAt: '2026-08-31T08:00:00.000Z',
    isLate: false,
    deptHeadReview: {
      id: 'rev-4',
      reviewedBy: 'staff-34',
      reviewerName: 'Tô Thị Lâm',
      reviewerRole: 'dept_head',
      reviewerRoleTitle: 'Tổ trưởng Ngữ văn - TV - TB',
      action: 'requested_edit',
      comment: 'Kế hoạch tốt nhưng cần bổ sung danh sách trích ngang cụ thể (Họ tên, ngày sinh, điểm TBM Văn năm lớp 11) của 05 học sinh đội tuyển vào file đính kèm trước khi trình BGH.',
      timestamp: '2026-08-31T08:00:00.000Z'
    },
    reviewHistory: [
      {
        id: 'rev-4',
        reviewedBy: 'staff-34',
        reviewerName: 'Tô Thị Lâm',
        reviewerRole: 'dept_head',
        reviewerRoleTitle: 'Tổ trưởng Ngữ văn - TV - TB',
        action: 'requested_edit',
        comment: 'Kế hoạch tốt nhưng cần bổ sung danh sách trích ngang cụ thể (Họ tên, ngày sinh, điểm TBM Văn năm lớp 11) của 05 học sinh đội tuyển vào file đính kèm trước khi trình BGH.',
        timestamp: '2026-08-31T08:00:00.000Z'
      }
    ],
    version: 1
  },
  {
    id: 'sub-4',
    periodId: 'period-4',
    periodTitle: 'Báo cáo chuyên đề đổi mới phương pháp dạy học & Kế hoạch bài dạy (STEM)',
    authorId: 'staff-71',
    authorName: 'Cao Văn Tùng',
    authorEmail: 'cvtung.c3docbinhkieu.dtp@moet.edu.vn',
    authorRole: 'teacher',
    authorRoleTitle: 'Giáo viên Sinh học',
    departmentId: 'khtn_cn',
    departmentName: 'Tổ Vật lý - Hóa học - Sinh học - CN',
    title: 'Chuyên đề STEM: Nghiên cứu mô hình vi sinh vật chuyển hóa rác hữu cơ trường học',
    content: `Kính gửi Tổ chuyên môn KHTN-CN và Ban Giám Hiệu,
Tôi xin nộp hồ sơ chuyên đề dạy học tích hợp STEM môn Sinh học kết hợp Công nghệ.
Hồ sơ gồm có:
1. Kế hoạch bài dạy chi tiết (Phụ lục IV công văn 5512/BGDĐT-GDTrH).
2. Phiếu học tập và tiêu chí đánh giá sản phẩm của học sinh (Rubrics).
3. Bài trình chiếu PowerPoint minh họa và video clip thực nghiệm của học sinh.`,
    attachments: [
      {
        id: 'att-4',
        name: 'Ke_Hoach_Bai_Day_STEM_ViSinh.docx',
        size: 1820000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: '#',
        uploadedAt: '2026-08-31T09:00:00.000Z'
      },
      {
        id: 'att-5',
        name: 'Slide_Trinh_Chieu_STEM.pptx',
        size: 8940000,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        url: '#',
        uploadedAt: '2026-08-31T09:02:00.000Z'
      }
    ],
    status: 'submitted',
    submittedAt: '2026-08-31T09:05:00.000Z',
    updatedAt: '2026-08-31T09:05:00.000Z',
    isLate: false,
    reviewHistory: [],
    version: 1
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'all',
    title: 'Thông báo: Hạn nộp Báo cáo bồi dưỡng HSG',
    message: 'Thời hạn nộp Báo cáo công tác bồi dưỡng Học sinh giỏi còn 02 ngày (Hạn chót: 23:59 ngày 02/09/2026). Đề nghị các tổ bộ môn khẩn trương hoàn thành.',
    type: 'deadline_alert',
    linkId: 'period-2',
    isRead: false,
    createdAt: '2026-08-31T07:00:00.000Z'
  },
  {
    id: 'notif-2',
    userId: 'staff-22',
    title: 'Báo cáo của bạn đã được Tổ trưởng phê duyệt',
    message: 'Báo cáo kết quả kiểm tra định kỳ môn Toán khối 10 đã được Thầy Nguyễn Văn Tới duyệt và chuyển Ban Giám Hiệu.',
    type: 'review_approved',
    linkId: 'sub-1',
    isRead: false,
    createdAt: '2026-08-28T09:15:00.000Z'
  },
  {
    id: 'notif-3',
    userId: 'staff-38',
    title: 'Yêu cầu chỉnh sửa bổ sung báo cáo',
    message: 'Cô Tô Thị Lâm (Tổ trưởng Ngữ văn) đã trả lại báo cáo "Kế hoạch bồi dưỡng HSG" kèm nhận xét cần bổ sung.',
    type: 'review_rejected',
    linkId: 'sub-3',
    isRead: false,
    createdAt: '2026-08-31T08:00:00.000Z'
  }
];
