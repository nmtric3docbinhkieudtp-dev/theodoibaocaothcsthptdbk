import { User, Department } from '../types';

export const OFFICIAL_DEPARTMENTS: Department[] = [
  {
    id: 'van_phong',
    name: 'Tổ Hành chính - Văn phòng',
    code: 'VAN_PHONG',
    headUserId: 'staff-5',
    headUserName: 'Thầy Trần Văn Út',
    description: 'Kế toán, Văn thư, Y tế, Thủ quỹ, Phục vụ và Bảo vệ',
    memberCount: 14
  },
  {
    id: 'toan',
    name: 'Tổ Toán',
    code: 'TOAN',
    headUserId: 'staff-19',
    headUserName: 'Thầy Nguyễn Văn Tới',
    description: 'Giảng dạy bộ môn Toán học cấp THCS và THPT',
    memberCount: 15
  },
  {
    id: 'ngu_van_tv_tb',
    name: 'Tổ Ngữ văn - Thư viện - Thiết bị',
    code: 'VAN_TV_TB',
    headUserId: 'staff-34',
    headUserName: 'Cô Tô Thị Lắm',
    description: 'Giảng dạy môn Ngữ văn, công tác Thư viện và quản lý Thiết bị dạy học',
    memberCount: 17
  },
  {
    id: 'su_dia_gdcd',
    name: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL',
    code: 'SU_DIA_GDCD',
    headUserId: 'staff-51',
    headUserName: 'Cô Lê Hồng Thúy',
    description: 'Bộ môn Lịch sử, Địa lý, GDCD, Giáo dục Kinh tế & Pháp luật',
    memberCount: 16
  },
  {
    id: 'khtn_cn',
    name: 'Tổ Vật lý - Hóa học - Sinh học - CN',
    code: 'LY_HOA_SINH_CN',
    headUserId: 'staff-67',
    headUserName: 'Cô Bùi Kim Huỳnh',
    description: 'Bộ môn Vật lý, Hóa học, Sinh học, Khoa học Tự nhiên và Công nghệ',
    memberCount: 26
  },
  {
    id: 'nn_tin',
    name: 'Tổ Ngoại ngữ - Tin học',
    code: 'NN_TIN',
    headUserId: 'staff-93',
    headUserName: 'Cô Lê Thị Ngọc Tuyền',
    description: 'Giảng dạy môn Tiếng Anh và Tin học các khối lớp',
    memberCount: 16
  },
  {
    id: 'gdtc_qp_nt',
    name: 'Tổ GDTC - QPAN - Nghệ thuật',
    code: 'GDTC_QP_NT',
    headUserId: 'staff-109',
    headUserName: 'Thầy Lê Văn Nguyên',
    description: 'Giáo dục thể chất, Giáo dục Quốc phòng & An ninh, Âm nhạc và Mỹ thuật',
    memberCount: 12
  }
];

// Helper to determine role and title STRICTLY from post-merger position (posAfter)
function mapRole(posAfter: string, posBefore: string, deptId: string, subject: string): { role: 'teacher' | 'dept_head' | 'principal' | 'admin', roleTitle: string } {
  const p = (posAfter || '').trim().toLowerCase();
  
  if (p === 'hiệu trưởng') {
    return { role: 'principal', roleTitle: 'Hiệu trưởng' };
  }
  if (p.includes('phó hiệu trưởng') || (deptId === 'bgh' && p.includes('phó'))) {
    return { role: 'principal', roleTitle: 'Phó Hiệu trưởng' };
  }
  if (p === 'tổ trưởng' || p.includes('tổ trưởng')) {
    if (deptId === 'van_phong') {
      return { role: 'dept_head', roleTitle: 'Tổ trưởng Hành chính - Văn phòng' };
    }
    return { role: 'dept_head', roleTitle: `Tổ trưởng (${subject})` };
  }
  if (p.includes('tổ phó')) {
    if (deptId === 'van_phong') {
      return { role: 'dept_head', roleTitle: 'Tổ phó Hành chính - Văn phòng' };
    }
    return { role: 'dept_head', roleTitle: `Tổ phó (${subject})` };
  }
  if (p.includes('nhân viên') || deptId === 'van_phong') {
    return { role: 'teacher', roleTitle: `Nhân viên ${subject}` };
  }
  return { role: 'teacher', roleTitle: `Giáo viên ${subject}` };
}

// Generate email prefix from name
function makeEmail(name: string, tt: number): string {
  const parts = name.trim().split(/\s+/);
  const lastName = parts[parts.length - 1].toLowerCase();
  const initials = parts.slice(0, -1).map(p => p[0]?.toLowerCase() || '').join('');
  const asciiLast = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd');
  const asciiInit = initials.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd');
  return `${asciiInit}${asciiLast}.${tt}.c3docbinhkieu.dtp@moet.edu.vn`;
}

interface RawStaff {
  tt: number;
  school: 'THPTĐBK' | 'THCSĐBK' | 'THCSTK';
  deptId: string;
  deptName: string;
  name: string;
  dob: string;
  gender: 'Nam' | 'Nữ';
  subject: string;
  party: boolean;
  posBefore: string;
  posAfter: string;
  qual: string;
  spec: string;
  pol: string;
  it: string;
  foreignLang: string;
  mgmtDegree?: string;
  notes?: string;
}

const RAW_120_DATA: RawStaff[] = [
  // --- BGH (1 -> 4) ---
  { tt: 1, school: 'THPTĐBK', deptId: 'bgh', deptName: 'Ban Giám Hiệu', name: 'Lê Thanh Cường', dob: '17/10/1975', gender: 'Nam', subject: 'Tiếng Anh', party: true, posBefore: 'Phó Hiệu trưởng', posAfter: 'Hiệu trưởng', qual: 'Thạc sỹ', spec: 'Quản lý giáo dục', pol: 'Cao cấp', it: 'A', foreignLang: 'Đại học', mgmtDegree: 'Thạc sỹ QLGD' },
  { tt: 2, school: 'THPTĐBK', deptId: 'bgh', deptName: 'Ban Giám Hiệu', name: 'Nguyễn Minh Trí', dob: '23/10/1986', gender: 'Nam', subject: 'Vật Lý', party: true, posBefore: 'Phó hiệu trưởng', posAfter: 'Phó hiệu trưởng', qual: 'ĐHSP', spec: 'GDCT', pol: 'Cao cấp', it: 'B1', foreignLang: 'B', mgmtDegree: 'CBQL các trường THPT' },
  { tt: 3, school: 'THCSĐBK', deptId: 'bgh', deptName: 'Ban Giám Hiệu', name: 'Phan Thanh Thảo', dob: '25/11/1966', gender: 'Nam', subject: 'Lịch sử', party: true, posBefore: 'Hiệu trưởng', posAfter: 'Phó hiệu trưởng', qual: 'Đại học', spec: 'Lịch sử', pol: 'Trung cấp', it: 'THCB', foreignLang: 'A2', mgmtDegree: 'Quản lý GD' },
  { tt: 4, school: 'THCSTK', deptId: 'bgh', deptName: 'Ban Giám Hiệu', name: 'Nguyễn Thanh Tòng', dob: '08/04/1979', gender: 'Nam', subject: 'KHTN', party: true, posBefore: 'Hiệu trưởng', posAfter: 'Phó hiệu trưởng', qual: 'Đại học', spec: 'Sinh học', pol: 'Trung cấp', it: 'A', foreignLang: 'B', mgmtDegree: 'Quản lý GD' },

  // --- VĂN PHÒNG (5 -> 18) ---
  { tt: 5, school: 'THPTĐBK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Trần Văn Út', dob: '01/05/1976', gender: 'Nam', subject: 'Kế toán', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ trưởng', qual: 'Đại Học', spec: 'Kế toán', pol: 'Sơ cấp', it: 'A', foreignLang: 'B' },
  { tt: 6, school: 'THCSĐBK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Nguyễn Văn Quân', dob: '21/07/1989', gender: 'Nam', subject: 'Kế toán', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'Tài chính - Ngân hàng', pol: '', it: 'B', foreignLang: 'B' },
  { tt: 7, school: 'THCSTK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Nguyễn Thị Thúy Huỳnh', dob: '09/09/1983', gender: 'Nữ', subject: 'Kế toán', party: false, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'Kế toán', pol: '', it: 'B', foreignLang: 'B' },
  { tt: 8, school: 'THPTĐBK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Nguyễn Thị Kim Ngọc', dob: '18/07/1984', gender: 'Nữ', subject: 'Văn thư', party: false, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Trung cấp', spec: 'Văn thư lưu trữ', pol: '', it: 'A', foreignLang: 'B' },
  { tt: 9, school: 'THPTĐBK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Minh Tho', dob: '16/01/1990', gender: 'Nữ', subject: 'Y tế', party: true, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Trung cấp', spec: 'Y sĩ đa khoa', pol: '', it: 'A', foreignLang: 'B' },
  { tt: 10, school: 'THPTĐBK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Lý Huỳnh Mai', dob: '01/01/1976', gender: 'Nữ', subject: 'Tạp vụ', party: false, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Phổ thông', spec: 'Tạp vụ', pol: '', it: '', foreignLang: '', notes: 'NLĐ' },
  { tt: 11, school: 'THPTĐBK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Nguyễn Ngọc Cường', dob: '01/01/1970', gender: 'Nam', subject: 'Bảo vệ', party: false, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Phổ thông', spec: 'Bảo vệ', pol: '', it: '', foreignLang: '', notes: 'NLĐ' },
  { tt: 12, school: 'THCSĐBK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Huỳnh Thị Thu Ngoan', dob: '20/08/1993', gender: 'Nữ', subject: 'Văn thư', party: true, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Trung cấp', spec: 'Văn thư - Hành chính', pol: '', it: 'A', foreignLang: '' },
  { tt: 13, school: 'THCSĐBK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Trần Thị Bích Hạnh', dob: '09/10/1988', gender: 'Nữ', subject: 'Y tế học đường', party: true, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Trung cấp', spec: 'Y sĩ', pol: '', it: 'A', foreignLang: 'B' },
  { tt: 14, school: 'THCSĐBK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Nguyễn Văn Thuấn', dob: '01/01/1976', gender: 'Nam', subject: 'Bảo vệ', party: false, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Phổ thông', spec: 'Bảo vệ', pol: '', it: '', foreignLang: '', notes: 'NLĐ' },
  { tt: 15, school: 'THCSĐBK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Đinh Thị Hanh', dob: '01/01/1977', gender: 'Nam', subject: 'Phục vụ', party: false, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Phổ thông', spec: 'Phục vụ', pol: '', it: '', foreignLang: '', notes: 'NLĐ' },
  { tt: 16, school: 'THCSTK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Nguyễn Thị Kim Kha', dob: '28/09/1986', gender: 'Nữ', subject: 'Văn thư', party: false, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Trung cấp', spec: 'Văn thư', pol: '', it: 'A', foreignLang: 'B' },
  { tt: 17, school: 'THCSTK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Huỳnh Quang Huy', dob: '24/11/1999', gender: 'Nam', subject: 'Bảo vệ', party: false, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Phổ thông', spec: 'Bảo vệ', pol: '', it: 'A', foreignLang: '', notes: 'NLĐ' },
  { tt: 18, school: 'THCSTK', deptId: 'van_phong', deptName: 'Tổ Hành chính - Văn phòng', name: 'Ngô Thị Hồng Thắm', dob: '11/01/1979', gender: 'Nữ', subject: 'Phục vụ', party: false, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Phổ thông', spec: 'Phục vụ', pol: '', it: 'A', foreignLang: '', notes: 'NLĐ' },

  // --- TOÁN (19 -> 33) ---
  { tt: 19, school: 'THPTĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Nguyễn Văn Tới', dob: '01/06/1982', gender: 'Nam', subject: 'Toán', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ trưởng', qual: 'ĐHSP', spec: 'Toán', pol: 'Trung cấp', it: 'CNTT cơ bản', foreignLang: '' },
  { tt: 20, school: 'THCSTK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Trần Quốc Huy', dob: '09/02/1982', gender: 'Nam', subject: 'Toán', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'Toán', pol: 'Sơ cấp', it: 'A', foreignLang: 'B' },
  { tt: 21, school: 'THCSĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Nguyễn Thị Bích Lang', dob: '25/09/1980', gender: 'Nữ', subject: 'Toán', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'Toán học', pol: 'Sơ cấp', it: 'Cao đẳng', foreignLang: 'B1' },
  { tt: 22, school: 'THPTĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Trần Văn Giang', dob: '01/01/1977', gender: 'Nam', subject: 'Toán', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Toán', pol: 'Sơ cấp', it: '', foreignLang: '' },
  { tt: 23, school: 'THPTĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Lê Cao Toàn', dob: '01/07/1975', gender: 'Nam', subject: 'Toán', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Toán', pol: 'Sơ cấp', it: 'A', foreignLang: 'B' },
  { tt: 24, school: 'THPTĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Lê Văn Toàn', dob: '30/06/1983', gender: 'Nam', subject: 'Toán', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Toán', pol: 'Sơ cấp', it: 'CNTT cơ bản', foreignLang: '' },
  { tt: 25, school: 'THPTĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Võ Thị Ngọc Hương', dob: '10/05/1982', gender: 'Nữ', subject: 'Toán', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Toán', pol: 'Sơ cấp', it: '', foreignLang: '' },
  { tt: 26, school: 'THCSĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Lê Thị Bình', dob: '27/07/1975', gender: 'Nữ', subject: 'Toán', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Toán học', pol: 'Trung cấp', it: 'Cao đẳng', foreignLang: '' },
  { tt: 27, school: 'THCSĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Nguyễn Thái Hùng', dob: '12/10/1980', gender: 'Nam', subject: 'Toán', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Toán học', pol: 'Sơ cấp', it: 'Cao đẳng', foreignLang: '' },
  { tt: 28, school: 'THCSĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Nguyễn Văn Ngoan', dob: '07/10/1981', gender: 'Nam', subject: 'Toán', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Toán học', pol: 'Sơ cấp', it: 'THCB', foreignLang: 'B' },
  { tt: 29, school: 'THCSĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Nguyễn Quốc Nguyễn', dob: '09/12/1982', gender: 'Nam', subject: 'Toán', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Toán học', pol: 'Sơ cấp', it: 'Cao đẳng', foreignLang: '' },
  { tt: 30, school: 'THCSĐBK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Nguyễn Văn Tài', dob: '10/10/1983', gender: 'Nam', subject: 'Toán', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Toán học', pol: 'Sơ cấp', it: 'Cao đẳng', foreignLang: '' },
  { tt: 31, school: 'THCSTK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Nguyễn Thành Tín', dob: '13/10/1988', gender: 'Nam', subject: 'Toán', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Toán', pol: 'Sơ cấp', it: 'A', foreignLang: 'A2', mgmtDegree: 'Chứng chỉ QLGD' },
  { tt: 32, school: 'THCSTK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Huỳnh Thị Huỳnh Nga', dob: '16/11/1992', gender: 'Nữ', subject: 'Toán', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Toán', pol: 'Sơ cấp', it: 'B', foreignLang: 'B' },
  { tt: 33, school: 'THCSTK', deptId: 'toan', deptName: 'Tổ Toán', name: 'Trần Văn Nhuận', dob: '14/01/1984', gender: 'Nam', subject: 'Toán', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Toán', pol: 'Sơ cấp', it: 'A', foreignLang: '' },

  // --- NGỮ VĂN - THƯ VIỆN - THIẾT BỊ (34 -> 50) ---
  { tt: 34, school: 'THPTĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Tô Thị Lắm', dob: '11/07/1983', gender: 'Nữ', subject: 'Ngữ văn', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ trưởng', qual: 'Thạc sỹ', spec: 'Văn học Việt Nam', pol: 'Sơ cấp', it: 'UD CNTT cơ bản', foreignLang: 'B1' },
  { tt: 35, school: 'THCSĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Trương Văn Nghĩa', dob: '01/01/1977', gender: 'Nam', subject: 'Ngữ văn', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'Ngữ văn', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 36, school: 'THCSTK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Huỳnh Thị Vân Nhi', dob: '01/01/1980', gender: 'Nữ', subject: 'Ngữ văn', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'Ngữ văn', pol: 'Sơ cấp', it: 'A', foreignLang: '', mgmtDegree: 'Chứng chỉ QLGD' },
  { tt: 37, school: 'THPTĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Hồ Văn Nhịnh', dob: '22/04/1976', gender: 'Nam', subject: 'Ngữ văn', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Thạc sỹ', spec: 'LLPB Văn học', pol: 'Sơ cấp', it: 'UD CNTT cơ bản', foreignLang: 'Cơ bản' },
  { tt: 38, school: 'THPTĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Lê Thị Mỹ Ny', dob: '01/01/1985', gender: 'Nữ', subject: 'Ngữ văn', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Ngữ Văn', pol: 'Sơ cấp', it: 'UD CNTT cơ bản', foreignLang: '' },
  { tt: 39, school: 'THPTĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Trương Thị Mỹ Duyên', dob: '25/03/1975', gender: 'Nữ', subject: 'Ngữ văn', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Ngữ Văn', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 40, school: 'THPTĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Nguyễn Thị Xuyến', dob: '20/07/1986', gender: 'Nữ', subject: 'Thư viện', party: true, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Đại Học', spec: 'Thư viện', pol: 'Sơ cấp', it: 'A', foreignLang: 'B' },
  { tt: 41, school: 'THCSĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Phạm Thanh Lâm', dob: '04/04/1980', gender: 'Nam', subject: 'Ngữ văn', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Ngữ văn', pol: 'Sơ cấp', it: 'B', foreignLang: 'A2' },
  { tt: 42, school: 'THCSĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Nguyễn Thị Kim Xoa', dob: '07/10/1983', gender: 'Nữ', subject: 'Ngữ văn', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Ngữ văn', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 43, school: 'THCSĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Hứa Thùy Dương', dob: '13/10/1985', gender: 'Nữ', subject: 'Ngữ văn', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Ngữ văn', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 44, school: 'THCSĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Lê Thị Hoài An', dob: '29/09/1995', gender: 'Nữ', subject: 'Ngữ văn', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Ngữ văn', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 45, school: 'THCSĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Hồ Văn Hữu', dob: '30/07/1982', gender: 'Nam', subject: 'Thư viện', party: true, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Cao đẳng', spec: 'Thư viện', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 46, school: 'THCSTK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Nguyễn Thị Thảo', dob: '10/02/1978', gender: 'Nữ', subject: 'Ngữ văn', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Ngữ văn', pol: 'Sơ cấp', it: 'A', foreignLang: 'B' },
  { tt: 47, school: 'THCSTK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Trần Thị Ngọc Tý', dob: '08/07/1984', gender: 'Nữ', subject: 'Thư viện', party: true, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Đại học', spec: 'Thư viện', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 48, school: 'THPTĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Phạm Thị Lệ Huyên', dob: '15/06/1988', gender: 'Nữ', subject: 'Thiết bị', party: true, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Đại Học', spec: 'SPTH', pol: 'Sơ cấp', it: 'ĐH', foreignLang: 'B' },
  { tt: 49, school: 'THCSĐBK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Nguyễn Văn Chữ', dob: '01/01/1977', gender: 'Nam', subject: 'Quản lý thiết bị', party: true, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Cao đẳng', spec: 'Quản lý thiết bị trường học', pol: '', it: 'THCB', foreignLang: 'B' },
  { tt: 50, school: 'THCSTK', deptId: 'ngu_van_tv_tb', deptName: 'Tổ Ngữ văn - Thư viện - Thiết bị', name: 'Trần Hoàng Yến Ngọc', dob: '01/01/1990', gender: 'Nữ', subject: 'Thiết bị', party: true, posBefore: 'Nhân viên', posAfter: 'Nhân viên', qual: 'Cao đẳng', spec: 'Thiết bị', pol: 'Sơ cấp', it: 'A', foreignLang: 'A2' },

  // --- LỊCH SỬ - ĐỊA LÝ - GDCD - GDKTPL (51 -> 66) ---
  { tt: 51, school: 'THCSĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Lê Hồng Thúy', dob: '17/07/1975', gender: 'Nữ', subject: 'GDCD', party: true, posBefore: 'Phó hiệu trưởng', posAfter: 'Tổ trưởng', qual: 'Đại học', spec: 'GDCT', pol: 'Trung cấp', it: 'B', foreignLang: 'B', mgmtDegree: 'Quản lý GD' },
  { tt: 52, school: 'THPTĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Trịnh Văn Sơn', dob: '25/05/1979', gender: 'Nam', subject: 'Sử', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'ĐHSP', spec: 'Lịch sử', pol: 'Trung cấp', it: '', foreignLang: '' },
  { tt: 53, school: 'THCSTK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Phạm Thị Mỹ Châu', dob: '27/04/1984', gender: 'Nữ', subject: 'LS-ĐL', party: true, posBefore: 'Tổ phó', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'Địa lí', pol: 'Sơ cấp', it: 'A', foreignLang: 'A' },
  { tt: 54, school: 'THPTĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Nguyễn Thị Bé Trang', dob: '15/04/1984', gender: 'Nữ', subject: 'Sử', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Lịch sử', pol: 'Sơ cấp', it: '', foreignLang: 'A2' },
  { tt: 55, school: 'THPTĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Trần Văn Rỡ', dob: '21/08/1981', gender: 'Nam', subject: 'Sử', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Thạc sỹ', spec: 'Lịch sử', pol: 'Sơ cấp', it: 'B', foreignLang: 'B' },
  { tt: 56, school: 'THPTĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Trần Phước Hòa', dob: '02/11/1982', gender: 'Nam', subject: 'Địa', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Thạc sỹ', spec: 'QLGD', pol: 'Trung cấp', it: 'CNTT cơ bản', foreignLang: 'B1' },
  { tt: 57, school: 'THPTĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Ngô Anh Tuấn', dob: '22/11/1986', gender: 'Nam', subject: 'Địa', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Cử nhân Địa lý', pol: 'Trung cấp', it: 'CNTT cơ bản', foreignLang: '', notes: 'Phụ trách Đoàn' },
  { tt: 58, school: 'THPTĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Phạm Nguyễn Văn Trường', dob: '02/01/1995', gender: 'Nữ', subject: 'GDKT&PL', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Cử nhân GDCT', pol: 'Sơ cấp', it: 'UDCNTTCB', foreignLang: 'B1' },
  { tt: 59, school: 'THCSĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Lê Thị Kim The', dob: '18/08/1988', gender: 'Nữ', subject: 'Lịch sử', party: true, posBefore: 'Tổ trưởng', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Lịch sử', pol: 'Sơ cấp', it: 'B', foreignLang: 'B' },
  { tt: 60, school: 'THCSĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Nguyễn Quốc Tân', dob: '10/03/1987', gender: 'Nam', subject: 'Lịch sử', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Lịch sử', pol: 'Sơ cấp', it: 'A', foreignLang: 'A2' },
  { tt: 61, school: 'THCSĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Nguyễn Thị Kim Đỉnh', dob: '23/01/1988', gender: 'Nữ', subject: 'Địa lý', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Địa lý', pol: 'Sơ cấp', it: 'THCB', foreignLang: 'A2' },
  { tt: 62, school: 'THCSĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Nguyễn Thị Lý', dob: '01/01/1989', gender: 'Nữ', subject: 'Địa lý', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Địa lý', pol: 'Sơ cấp', it: 'A', foreignLang: 'B' },
  { tt: 63, school: 'THCSĐBK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Nguyễn Thị Xe', dob: '01/01/1978', gender: 'Nữ', subject: 'GDCD', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Giáo dục chính trị', pol: 'Sơ cấp', it: 'THCB', foreignLang: '' },
  { tt: 64, school: 'THCSTK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Châu Thị Kim Hà', dob: '18/02/1984', gender: 'Nữ', subject: 'LS-ĐL', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Lịch sử', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 65, school: 'THCSTK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Nguyễn Thị Kim Sang', dob: '22/08/1988', gender: 'Nữ', subject: 'LS-ĐL', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Địa lí', pol: 'Sơ cấp', it: 'A', foreignLang: 'A' },
  { tt: 66, school: 'THCSTK', deptId: 'su_dia_gdcd', deptName: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL', name: 'Nguyễn Mỹ Ngân', dob: '12/11/1988', gender: 'Nữ', subject: 'GDCD', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Giáo dục chính trị', pol: 'Sơ cấp', it: 'B', foreignLang: 'B' },

  // --- VẬT LÝ - HÓA HỌC - SINH HỌC - CN (67 -> 92) ---
  { tt: 67, school: 'THPTĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Bùi Kim Huỳnh', dob: '19/04/1986', gender: 'Nữ', subject: 'Sinh học', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ trưởng', qual: 'ĐHSP', spec: 'Sinh - KTNN', pol: 'Trung cấp', it: 'A', foreignLang: 'C' },
  { tt: 68, school: 'THCSTK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Thái Văn Tiến', dob: '01/01/1978', gender: 'Nam', subject: 'KHTN', party: true, posBefore: 'Phó hiệu trưởng', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'Sinh học', pol: 'Sơ cấp', it: 'B', foreignLang: 'B', mgmtDegree: 'Quản lý GD' },
  { tt: 69, school: 'THPTĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Phạm Biên Thùy', dob: '01/01/1980', gender: 'Nam', subject: 'Vật Lý', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'Thạc sỹ', spec: 'Quang Học', pol: 'Trung cấp', it: 'CNTT cơ bản', foreignLang: 'B1' },
  { tt: 70, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Nguyễn Thị Hiếu', dob: '15/07/1980', gender: 'Nữ', subject: 'Sinh', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'Sinh học', pol: 'Sơ cấp', it: 'B', foreignLang: 'B', mgmtDegree: 'Quản lý GD' },
  { tt: 71, school: 'THPTĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Cao Văn Tùng', dob: '17/07/1980', gender: 'Nam', subject: 'Sinh học', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Sinh', pol: 'Sơ cấp', it: 'CNTT cơ bản', foreignLang: 'A' },
  { tt: 72, school: 'THPTĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Trần Thị Ngọc Hiền', dob: '18/03/1983', gender: 'Nữ', subject: 'Vật Lý', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Thạc sỹ', spec: 'vật lý', pol: 'Sơ cấp', it: 'CNTT cơ bản', foreignLang: 'A' },
  { tt: 73, school: 'THPTĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Phan Thị Ngọc Thơ', dob: '06/08/1988', gender: 'Nữ', subject: 'Hóa', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Thạc sỹ', spec: 'Hóa học', pol: 'Sơ cấp', it: 'A', foreignLang: 'A' },
  { tt: 74, school: 'THPTĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Phạm Long Phi', dob: '20/04/1982', gender: 'Nam', subject: 'Hóa', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Hóa', pol: 'Sơ cấp', it: 'CNTT cơ bản', foreignLang: '' },
  { tt: 75, school: 'THPTĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Trần Thị Kiều', dob: '18/11/1980', gender: 'Nữ', subject: 'Hóa', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Hóa', pol: 'Sơ cấp', it: 'CNTT cơ bản', foreignLang: '' },
  { tt: 76, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Trần Thị Hậu', dob: '01/01/1983', gender: 'Nữ', subject: 'Lý', party: true, posBefore: 'Tổ phó', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Vật lý', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 77, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Lê Thái Phương', dob: '01/01/1980', gender: 'Nam', subject: 'Hóa', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Hóa học', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 78, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Võ Hoàng Toàn', dob: '04/10/1987', gender: 'Nam', subject: 'Hóa', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Hóa học', pol: 'Sơ cấp', it: 'A', foreignLang: 'A2' },
  { tt: 79, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Nguyễn Thị Thắm', dob: '11/11/1981', gender: 'Nữ', subject: 'Lý', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Vật lý', pol: 'Sơ cấp', it: 'THCB', foreignLang: 'B1' },
  { tt: 80, school: 'THCSTK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Nguyễn Thị Bích Phượng', dob: '14/04/1987', gender: 'Nữ', subject: 'KHTN', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Vật lý', pol: 'Sơ cấp', it: 'A', foreignLang: 'C' },
  { tt: 81, school: 'THCSTK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Võ Ngọc Đình Văn', dob: '23/11/1995', gender: 'Nam', subject: 'KHTN', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Hoá học', pol: 'Sơ cấp', it: 'B', foreignLang: 'B' },
  { tt: 82, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Nguyễn Thị Cẩm Nhung', dob: '13/03/1983', gender: 'Nữ', subject: 'Sinh', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Sinh học', pol: 'Sơ cấp', it: 'THCB', foreignLang: 'A2' },
  { tt: 83, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Nguyễn Kim Ngân', dob: '28/10/1990', gender: 'Nữ', subject: 'Sinh', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Sinh học', pol: 'Sơ cấp', it: 'A', foreignLang: 'A2' },
  { tt: 84, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Hồ Thị Ngọc Tài', dob: '07/06/1989', gender: 'Nữ', subject: 'Sinh', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Sinh học', pol: 'Sơ cấp', it: 'B', foreignLang: 'A2' },
  { tt: 85, school: 'THCSTK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Trần Kim Phương', dob: '04/03/1981', gender: 'Nữ', subject: 'Sinh học', party: true, posBefore: 'Tổ phó', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Sinh học', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 86, school: 'THCSTK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Đinh Thị Giàu', dob: '20/08/1989', gender: 'Nữ', subject: 'Sinh học', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Sinh học', pol: 'Sơ cấp', it: 'A', foreignLang: 'B' },
  { tt: 87, school: 'THCSTK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Nguyễn Thị Lụa', dob: '04/04/1979', gender: 'Nữ', subject: 'Sinh học', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Sinh học', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 88, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Trần Phi Hải', dob: '22/10/1977', gender: 'Nam', subject: 'Công nghệ', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Công nghệ - KTCN', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 89, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Trần Thị Cẩm', dob: '01/01/1981', gender: 'Nữ', subject: 'Công nghệ', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Công nghệ - KTNN', pol: 'Sơ cấp', it: 'THCB', foreignLang: '' },
  { tt: 90, school: 'THCSĐBK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Lê Kim Ngân', dob: '17/04/1986', gender: 'Nữ', subject: 'Công nghệ', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Công nghệ - KTNN', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 91, school: 'THCSTK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Nguyễn Thị Ngọc Diễm', dob: '21/02/1989', gender: 'Nữ', subject: 'Công nghệ', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Kỹ thuật nông nghiệp', pol: 'Sơ cấp', it: 'B', foreignLang: 'A2' },
  { tt: 92, school: 'THCSTK', deptId: 'khtn_cn', deptName: 'Tổ Vật lý - Hóa học - Sinh học - CN', name: 'Phan Văn Tặt', dob: '01/01/1968', gender: 'Nam', subject: 'Công nghệ', party: true, posBefore: 'Tổ trưởng', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Kỹ thuật nông nghiệp', pol: 'Sơ cấp', it: 'B', foreignLang: 'B', mgmtDegree: 'Quản lý GD' },

  // --- NGOẠI NGỮ - TIN HỌC (93 -> 108) ---
  { tt: 93, school: 'THCSTK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Lê Thị Ngọc Tuyền', dob: '11/02/1990', gender: 'Nữ', subject: 'Tiếng Anh', party: true, posBefore: 'Phó hiệu trưởng', posAfter: 'Tổ trưởng', qual: 'Thạc sĩ', spec: 'Tiếng Anh', pol: 'Trung cấp', it: 'A', foreignLang: 'B', mgmtDegree: 'Quản lý GD' },
  { tt: 94, school: 'THPTĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Nguyễn Trung Hiếu', dob: '01/01/1984', gender: 'Nam', subject: 'Tin học', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'ĐHSP', spec: 'Tin học', pol: 'Trung cấp', it: 'ĐH', foreignLang: 'A' },
  { tt: 95, school: 'THCSĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Nguyễn Thị Mai Khanh', dob: '17/11/1981', gender: 'Nữ', subject: 'Tiếng Anh', party: true, posBefore: 'Tổ trưởng', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'Tiếng Anh', pol: 'Sơ cấp', it: 'THCB', foreignLang: 'B2', mgmtDegree: 'Quản lý GD' },
  { tt: 96, school: 'THPTĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Võ Thị Hiền Thi', dob: '25/04/1985', gender: 'Nữ', subject: 'Tiếng Anh', party: true, posBefore: 'Tổ phó', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Tiếng Anh', pol: 'Sơ cấp', it: 'CNTT cơ bản', foreignLang: 'C1' },
  { tt: 97, school: 'THPTĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Ngô Bảo Quốc', dob: '30/08/1970', gender: 'Nam', subject: 'Tiếng Anh', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Tiếng Anh', pol: 'Sơ cấp', it: 'CNTT cơ bản', foreignLang: 'C1' },
  { tt: 98, school: 'THPTĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Trương Sơn Bền', dob: '27/08/2000', gender: 'Nam', subject: 'Tiếng Anh', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Tiếng Anh', pol: 'Sơ cấp', it: 'CNTT cơ bản', foreignLang: 'C1' },
  { tt: 99, school: 'THPTĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Nguyễn Thị Vân Anh', dob: '08/11/1991', gender: 'Nữ', subject: 'Tiếng Anh', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Tiếng Anh', pol: 'Sơ cấp', it: 'CNTT cơ bản', foreignLang: 'C1' },
  { tt: 100, school: 'THPTĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Đào Thị Ngọc Liên', dob: '02/11/1987', gender: 'Nữ', subject: 'Tin học', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Tin học', pol: 'Sơ cấp', it: 'ĐH', foreignLang: '' },
  { tt: 101, school: 'THPTĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Lê Thị Thu Diễm', dob: '05/08/1980', gender: 'Nữ', subject: 'Tin học', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐHSP', spec: 'Tin học', pol: 'Sơ cấp', it: 'ĐH', foreignLang: '' },
  { tt: 102, school: 'THCSĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Trần Thanh Hậu', dob: '02/08/1976', gender: 'Nam', subject: 'Tiếng Anh', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Tiếng Anh', pol: 'Trung cấp', it: 'THCB', foreignLang: 'B2', mgmtDegree: 'Quản lý GD' },
  { tt: 103, school: 'THCSĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Hồ Mai Thảo', dob: '22/11/1975', gender: 'Nữ', subject: 'Tiếng Anh', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Tiếng Anh', pol: 'Sơ cấp', it: 'THCB', foreignLang: 'B2' },
  { tt: 104, school: 'THCSĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Nguyễn Thị Thùy Dương', dob: '19/07/1982', gender: 'Nữ', subject: 'Tiếng Anh', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Tiếng Anh', pol: 'Sơ cấp', it: 'A', foreignLang: 'B2' },
  { tt: 105, school: 'THCSĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Mai Phước Lộc', dob: '28/08/1982', gender: 'Nam', subject: 'Tin học', party: true, posBefore: 'Tổ trưởng', posAfter: 'Giáo viên', qual: 'Kỹ sư CNTT', spec: 'Tin học', pol: 'Sơ cấp', it: 'KS CNTT', foreignLang: '' },
  { tt: 106, school: 'THCSĐBK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Bùi Kim Phướng', dob: '07/10/1989', gender: 'Nữ', subject: 'Tin học', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Tin học', pol: 'Sơ cấp', it: 'Đại học', foreignLang: 'A2' },
  { tt: 107, school: 'THCSTK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Lê Minh Thành', dob: '01/01/1989', gender: 'Nam', subject: 'Tiếng Anh', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Tiếng Anh', pol: 'Sơ cấp', it: 'B', foreignLang: 'B' },
  { tt: 108, school: 'THCSTK', deptId: 'nn_tin', deptName: 'Tổ Ngoại ngữ - Tin học', name: 'Lê Phước Hậu', dob: '25/02/1980', gender: 'Nam', subject: 'Tin học', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Tin học', pol: 'Sơ cấp', it: 'ĐH', foreignLang: '' },

  // --- GDTC - QPAN - NGHỆ THUẬT (109 -> 120) ---
  { tt: 109, school: 'THCSĐBK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Lê Văn Nguyên', dob: '01/01/1975', gender: 'Nam', subject: 'GDTC', party: true, posBefore: 'Phó hiệu trưởng', posAfter: 'Tổ trưởng', qual: 'Đại học', spec: 'GDTC', pol: 'Trung cấp', it: 'THCB', foreignLang: 'A2', mgmtDegree: 'Quản lý GD' },
  { tt: 110, school: 'THPTĐBK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Nguyễn Kim Rạng', dob: '26/03/1986', gender: 'Nữ', subject: 'GDQPAN', party: true, posBefore: 'Giáo viên', posAfter: 'Tổ phó', qual: 'ĐH', spec: 'GDQPAN', pol: 'Trung cấp', it: 'CNTT cơ bản', foreignLang: 'B' },
  { tt: 111, school: 'THCSTK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Lê Thị Ngọc Điệp', dob: '02/02/1978', gender: 'Nữ', subject: 'GDTC', party: true, posBefore: 'Tổ phó', posAfter: 'Tổ phó', qual: 'Đại học', spec: 'GDTC', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 112, school: 'THPTĐBK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Hồ Hoài Ngân', dob: '06/07/1989', gender: 'Nam', subject: 'Thể dục', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'ĐH', spec: 'GD Thể chất', pol: 'Sơ cấp', it: 'CNTT cơ bản', foreignLang: '' },
  { tt: 113, school: 'THCSĐBK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Lê Minh Đạt', dob: '10/10/1969', gender: 'Nam', subject: 'Mỹ thuật', party: true, posBefore: 'Tổ trưởng', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Mỹ thuật', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 114, school: 'THCSĐBK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Lê Ngọc Ẩn', dob: '10/10/1983', gender: 'Nam', subject: 'GDTC', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'GDTC', pol: 'Sơ cấp', it: 'B', foreignLang: 'B' },
  { tt: 115, school: 'THCSĐBK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Huỳnh Thanh Dân', dob: '12/05/1992', gender: 'Nam', subject: 'GDTC', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'GDTC', pol: 'Sơ cấp', it: 'B', foreignLang: 'A1' },
  { tt: 116, school: 'THCSĐBK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Nguyễn Thanh Hùng', dob: '25/02/1980', gender: 'Nam', subject: 'GDTC', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'GDTC', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 117, school: 'THCSĐBK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Lê Thị Tuyết Xanh', dob: '06/03/1981', gender: 'Nữ', subject: 'Âm nhạc', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Âm nhạc', pol: 'Sơ cấp', it: 'A', foreignLang: '' },
  { tt: 118, school: 'THCSTK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Trần Thị Mỹ Quốc', dob: '09/07/1986', gender: 'Nữ', subject: 'Mỹ thuật', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Mỹ thuật', pol: 'Sơ cấp', it: 'B', foreignLang: '' },
  { tt: 119, school: 'THCSTK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Lê Văn Chính', dob: '01/01/1982', gender: 'Nam', subject: 'GDTC', party: true, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'GDTC', pol: 'Sơ cấp', it: 'A', foreignLang: 'A2' },
  { tt: 120, school: 'THCSTK', deptId: 'gdtc_qp_nt', deptName: 'Tổ GDTC - QPAN - Nghệ thuật', name: 'Nguyễn Anh Văn', dob: '23/06/1986', gender: 'Nam', subject: 'Âm nhạc', party: false, posBefore: 'Giáo viên', posAfter: 'Giáo viên', qual: 'Đại học', spec: 'Âm nhạc', pol: 'Sơ cấp', it: 'B', foreignLang: 'B' }
];

export interface HomeroomInfo {
  stt: number;
  campus: 'THPT' | 'DBK' | 'TK';
  className: string;
  teacherName: string;
  studentCount: number;
  grade: number;
}

export const HOMEROOM_ROSTER_53: HomeroomInfo[] = [
  // --- Khối THPT (14 lớp) ---
  { stt: 1, campus: 'THPT', className: '12CB1', teacherName: 'Phan Thị Ngọc Thơ', studentCount: 28, grade: 12 },
  { stt: 2, campus: 'THPT', className: '12CB2', teacherName: 'Trương Thị Mỹ Duyên', studentCount: 23, grade: 12 },
  { stt: 3, campus: 'THPT', className: '12CB3', teacherName: 'Võ Thị Ngọc Hương', studentCount: 47, grade: 12 },
  { stt: 4, campus: 'THPT', className: '12CB4', teacherName: 'Nguyễn Thị Bé Trang', studentCount: 47, grade: 12 },
  { stt: 5, campus: 'THPT', className: '12CB5', teacherName: 'Trịnh Văn Sơn', studentCount: 41, grade: 12 },
  { stt: 6, campus: 'THPT', className: '11CB1', teacherName: 'Bùi Kim Huỳnh', studentCount: 45, grade: 11 },
  { stt: 7, campus: 'THPT', className: '11CB2', teacherName: 'Phạm Long Phi', studentCount: 35, grade: 11 },
  { stt: 8, campus: 'THPT', className: '11CB3', teacherName: 'Trần Văn Rỡ', studentCount: 34, grade: 11 },
  { stt: 9, campus: 'THPT', className: '11CB4', teacherName: 'Đào Thị Ngọc Liên', studentCount: 33, grade: 11 },
  { stt: 10, campus: 'THPT', className: '10CB1', teacherName: 'Cao Văn Tùng', studentCount: 37, grade: 10 },
  { stt: 11, campus: 'THPT', className: '10CB2', teacherName: 'Trần Thị Kiều', studentCount: 29, grade: 10 },
  { stt: 12, campus: 'THPT', className: '10CB3', teacherName: 'Lê Thị Mỹ Ny', studentCount: 44, grade: 10 },
  { stt: 13, campus: 'THPT', className: '10CB4', teacherName: 'Lê Thị Thu Diễm', studentCount: 47, grade: 10 },
  { stt: 14, campus: 'THPT', className: '10CB5', teacherName: 'Hồ Văn Nhịnh', studentCount: 45, grade: 10 },

  // --- THCS Điểm Đốc Binh Kiều - DBK (24 lớp) ---
  { stt: 15, campus: 'DBK', className: '6A1', teacherName: 'Hồ Thị Ngọc Tài', studentCount: 42, grade: 6 },
  { stt: 16, campus: 'DBK', className: '6A2', teacherName: 'Nguyễn Thị Thắm', studentCount: 41, grade: 6 },
  { stt: 17, campus: 'DBK', className: '6A3', teacherName: 'Bùi Kim Phướng', studentCount: 43, grade: 6 },
  { stt: 18, campus: 'DBK', className: '6A4', teacherName: 'Nguyễn Thanh Hùng', studentCount: 41, grade: 6 },
  { stt: 19, campus: 'DBK', className: '6A5', teacherName: 'Lê Kim Ngân', studentCount: 41, grade: 6 },
  { stt: 20, campus: 'DBK', className: '6A6', teacherName: 'Lê Thị Bình', studentCount: 42, grade: 6 },
  { stt: 21, campus: 'DBK', className: '7A1', teacherName: 'Nguyễn Văn Ngoan', studentCount: 40, grade: 7 },
  { stt: 22, campus: 'DBK', className: '7A2', teacherName: 'Mai Phước Lộc', studentCount: 40, grade: 7 },
  { stt: 23, campus: 'DBK', className: '7A3', teacherName: 'Nguyễn Quốc Nguyễn', studentCount: 41, grade: 7 },
  { stt: 24, campus: 'DBK', className: '7A4', teacherName: 'Lê Ngọc Ẩn', studentCount: 40, grade: 7 },
  { stt: 25, campus: 'DBK', className: '7A5', teacherName: 'Nguyễn Thị Hiếu', studentCount: 39, grade: 7 },
  { stt: 26, campus: 'DBK', className: '7A6', teacherName: 'Trần Thị Cẩm', studentCount: 40, grade: 7 },
  { stt: 27, campus: 'DBK', className: '8A1', teacherName: 'Nguyễn Thái Hùng', studentCount: 43, grade: 8 },
  { stt: 28, campus: 'DBK', className: '8A2', teacherName: 'Trần Phi Hải', studentCount: 42, grade: 8 },
  { stt: 29, campus: 'DBK', className: '8A3', teacherName: 'Nguyễn Thị Xe', studentCount: 43, grade: 8 },
  { stt: 30, campus: 'DBK', className: '8A4', teacherName: 'Nguyễn Kim Ngân', studentCount: 43, grade: 8 },
  { stt: 31, campus: 'DBK', className: '8A5', teacherName: 'Võ Hoàng Toàn', studentCount: 43, grade: 8 },
  { stt: 32, campus: 'DBK', className: '8A6', teacherName: 'Huỳnh Thanh Dân', studentCount: 42, grade: 8 },
  { stt: 33, campus: 'DBK', className: '9A1', teacherName: 'Nguyễn Thị Cẩm Nhung', studentCount: 42, grade: 9 },
  { stt: 34, campus: 'DBK', className: '9A2', teacherName: 'Trần Thị Hậu', studentCount: 39, grade: 9 },
  { stt: 35, campus: 'DBK', className: '9A3', teacherName: 'Nguyễn Thị Bích Lang', studentCount: 44, grade: 9 },
  { stt: 36, campus: 'DBK', className: '9A4', teacherName: 'Nguyễn Văn Tài', studentCount: 43, grade: 9 },
  { stt: 37, campus: 'DBK', className: '9A5', teacherName: 'Hồ Mai Thảo', studentCount: 42, grade: 9 },
  { stt: 38, campus: 'DBK', className: '9A6', teacherName: 'Lê Thái Phương', studentCount: 43, grade: 9 },

  // --- THCS Điểm Tân Kiều - TK (15 lớp) ---
  { stt: 39, campus: 'TK', className: '6A7', teacherName: 'Nguyễn Thị Kim Sang', studentCount: 41, grade: 6 },
  { stt: 40, campus: 'TK', className: '6A8', teacherName: 'Lê Thị Ngọc Điệp', studentCount: 43, grade: 6 },
  { stt: 41, campus: 'TK', className: '6A9', teacherName: 'Nguyễn Thị Ngọc Diễm', studentCount: 42, grade: 6 },
  { stt: 42, campus: 'TK', className: '6A10', teacherName: 'Nguyễn Thị Lụa', studentCount: 41, grade: 6 },
  { stt: 43, campus: 'TK', className: '7A7', teacherName: 'Trần Kim Phương', studentCount: 47, grade: 7 },
  { stt: 44, campus: 'TK', className: '7A8', teacherName: 'Phạm Thị Mỹ Châu', studentCount: 45, grade: 7 },
  { stt: 45, campus: 'TK', className: '7A9', teacherName: 'Lê Văn Chính', studentCount: 45, grade: 7 },
  { stt: 46, campus: 'TK', className: '8A7', teacherName: 'Thái Văn Tiến', studentCount: 39, grade: 8 },
  { stt: 47, campus: 'TK', className: '8A8', teacherName: 'Nguyễn Thị Bích Phượng', studentCount: 38, grade: 8 },
  { stt: 48, campus: 'TK', className: '8A9', teacherName: 'Lê Phước Hậu', studentCount: 38, grade: 8 },
  { stt: 49, campus: 'TK', className: '8A10', teacherName: 'Trần Văn Nhuận', studentCount: 38, grade: 8 },
  { stt: 50, campus: 'TK', className: '9A7', teacherName: 'Trần Quốc Huy', studentCount: 40, grade: 9 },
  { stt: 51, campus: 'TK', className: '9A8', teacherName: 'Đinh Thị Giàu', studentCount: 38, grade: 9 },
  { stt: 52, campus: 'TK', className: '9A9', teacherName: 'Nguyễn Mỹ Ngân', studentCount: 39, grade: 9 },
  { stt: 53, campus: 'TK', className: '9A10', teacherName: 'Nguyễn Thành Tín', studentCount: 40, grade: 9 }
];

// Helper to normalize names for comparison
const normalizeStr = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');

// Build homeroom lookup map
const homeroomMap = new Map<string, HomeroomInfo>();
HOMEROOM_ROSTER_53.forEach(h => {
  homeroomMap.set(normalizeStr(h.teacherName), h);
});

export const OFFICIAL_USERS: User[] = RAW_120_DATA.map((item) => {
  const { role, roleTitle } = mapRole(item.posAfter, item.posBefore, item.deptId, item.subject);
  const isThayTri = item.tt === 2 || item.name === 'Nguyễn Minh Trí';
  const userEmail = isThayTri ? 'nmtri.c3docbinhkieu.dtp@moet.edu.vn' : makeEmail(item.name, item.tt);

  // Check homeroom assignment
  const hrInfo = homeroomMap.get(normalizeStr(item.name));

  return {
    id: `staff-${item.tt}`,
    orderNo: item.tt,
    originalSchool: item.school,
    departmentId: item.deptId,
    departmentName: item.deptName,
    name: item.name,
    dateOfBirth: item.dob,
    gender: item.gender,
    subject: item.subject,
    partyMember: item.party,
    positionBefore: item.posBefore,
    positionAfter: item.posAfter,
    role: isThayTri ? 'admin' : role,
    roleTitle: isThayTri ? 'Phó Hiệu trưởng (Quản trị hệ thống)' : roleTitle,
    qualification: item.qual,
    specialization: item.spec,
    politicalTheory: item.pol,
    itSkill: item.it,
    foreignLanguage: item.foreignLang,
    managementDegree: item.mgmtDegree,
    notes: item.notes,
    email: userEmail,
    isActive: true,

    // GVCN fields
    isHomeroomTeacher: !!hrInfo,
    homeroomClass: hrInfo?.className,
    homeroomCampus: hrInfo?.campus,
    homeroomStudentCount: hrInfo?.studentCount,
    homeroomGrade: hrInfo?.grade
  } as User;
});

// 19 Tổ trưởng & Tổ phó thuộc 6 Tổ chuyên môn (không bao gồm Tổ Văn phòng)
export const SPECIALIZED_DEPT_HEADS_19: User[] = OFFICIAL_USERS.filter(u => 
  u.role === 'dept_head' && u.departmentId !== 'van_phong' && u.departmentId !== 'bgh'
);
