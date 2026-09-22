import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Users, 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  FileCheck, 
  BookOpen, 
  Table, 
  Info, 
  Eye, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { DepartmentMeetingMinutesData, User, SchoolInfo } from '../../types';
import { 
  DEFAULT_DEPARTMENT_MEETING_DOCUMENTS, 
  DEFAULT_DEPARTMENT_MEETING_CENTRAL_TASKS,
  exportDepartmentMeetingToWord,
  exportDepartmentMeetingToPdf,
  generateDepartmentMeetingText,
  generateDepartmentMeetingHtml
} from '../../utils/departmentMeetingExporter';

interface DepartmentMeetingMinutesFormProps {
  currentUser: User;
  initialData?: DepartmentMeetingMinutesData;
  schoolInfo?: SchoolInfo;
  onChange: (data: DepartmentMeetingMinutesData, generatedText: string) => void;
}

export const DepartmentMeetingMinutesForm: React.FC<DepartmentMeetingMinutesFormProps> = ({
  currentUser,
  initialData,
  schoolInfo,
  onChange
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Ngày giờ hiện tại
  const now = new Date();
  const defaultDay = String(now.getDate());
  const defaultMonth = String(now.getMonth() + 1);
  const defaultYear = String(now.getFullYear());
  const defaultHour = String(now.getHours()).padStart(2, '0');
  const defaultMinute = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');

  // Khởi tạo state
  const [formData, setFormData] = useState<DepartmentMeetingMinutesData>(() => {
    if (initialData) return initialData;

    const deptName = currentUser.departmentName || 'Chuyên Môn';
    const cleanDept = deptName.replace(/^Tổ\s+/i, '').trim();

    return {
      departmentName: cleanDept.toUpperCase(),
      meetingNumber: 'lần 1',
      academicYear: '2026 - 2027',
      timeHour: defaultHour,
      timeMinute: defaultMinute,
      meetingDate: defaultDay,
      meetingMonth: defaultMonth,
      meetingYear: defaultYear,
      location: 'Phòng tổ chuyên môn',
      totalMembers: 12,
      presentMembers: 12,
      absentCount: 0,
      absentWithPermission: '0',
      absentReason: '',
      absentWithoutPermission: '0',
      chairPerson: currentUser.name || 'Nguyễn Văn A',
      chairTitle: 'Tổ trưởng',
      secretary: '',
      reviewStrengths: 'Tập thể giáo viên trong tổ chấp hành tốt quy chế chuyên môn, tham gia đầy đủ các buổi tập huấn chuyên môn đầu năm.',
      reviewWeaknesses: 'Việc nộp một số kế hoạch cá nhân đôi lúc còn chậm trễ so với hạn định.',
      reviewCauses: 'Đầu năm học nhiều hồ sơ sổ sách và chuẩn bị giảng dạy đồng thời.',
      reviewSolutions: 'Tổ trưởng nhắc nhở kịp thời trên nhóm Zalo của tổ và phân công hỗ trợ lẫn nhau.',
      documentsDeployed: DEFAULT_DEPARTMENT_MEETING_DOCUMENTS,
      centralTasks: DEFAULT_DEPARTMENT_MEETING_CENTRAL_TASKS,
      includeGradeTable: true,
      memberOpinions: 'Các thành viên trong tổ thống nhất cao với kế hoạch giáo dục của nhà trường và dự thảo kế hoạch của tổ.',
      conclusion: 'Tổ trưởng kết luận: Đề nghị toàn thể giáo viên trong tổ hoàn thành phân phối chương trình và kế hoạch bài dạy trước ngày 23/9/2026; thực hiện kiểm tra đánh giá đúng quy định.',
      recommendations: 'Kính đề xuất nhà trường trang bị thêm máy chiếu cho phòng học bộ môn để phục vụ tốt hơn cho hoạt động dạy học.',
      endHour: '10',
      endMinute: '30'
    };
  });

  // Tự động tính số vắng khi thay đổi tổng số hoặc số tham dự
  const handleMemberCountChange = (field: 'totalMembers' | 'presentMembers', val: number) => {
    setFormData(prev => {
      const nextTotal = field === 'totalMembers' ? val : Number(prev.totalMembers) || 0;
      const nextPresent = field === 'presentMembers' ? val : Number(prev.presentMembers) || 0;
      const diff = Math.max(0, nextTotal - nextPresent);
      return {
        ...prev,
        [field]: val,
        absentCount: diff,
        absentWithPermission: diff > 0 ? String(diff) : '0',
        absentWithoutPermission: '0'
      };
    });
  };

  // Đồng bộ ra ngoài cha mỗi khi formData thay đổi
  useEffect(() => {
    const text = generateDepartmentMeetingText(formData);
    onChange(formData, text);
  }, [formData]);

  const handleDownloadWord = () => {
    exportDepartmentMeetingToWord(
      formData, 
      schoolInfo, 
      `Bien_Ban_Hop_To_${formData.departmentName || 'Chuyen_Mon'}_${formData.meetingNumber || 'Lan_1'}`
    );
  };

  const handlePrintPdf = () => {
    exportDepartmentMeetingToPdf(formData, schoolInfo);
  };

  return (
    <div className="space-y-6">
      {/* THANH ĐIỀU KHIỂN XUẤT TÀI LIỆU VÀ CHUYỂN TAB */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-950 text-base flex items-center gap-2">
              Biên Bản Sinh Hoạt Tổ Chuyên Môn
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                Mẫu chuẩn hành chính
              </span>
            </h4>
            <p className="text-xs text-emerald-700">
              Nhập nội dung biên bản và tải file Word (.doc) hoặc in / xuất file PDF (.pdf) chuẩn thể thức lưu trữ trên máy tính.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Nút Tab Chỉnh sửa / Xem trước */}
          <div className="bg-white p-1 rounded-lg border border-emerald-200 flex items-center text-xs font-semibold shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'form' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chỉnh Sửa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'preview' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Xem Trang In
            </button>
          </div>

          {/* Nút Xuất PDF */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            title="Mở cửa sổ in ấn hoặc lưu tệp PDF trên máy tính"
          >
            <Printer className="w-4 h-4" />
            <span>Xuất PDF / In</span>
          </button>

          {/* Nút Tải Word */}
          <button
            type="button"
            onClick={handleDownloadWord}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            title="Tải về file Microsoft Word (.doc) lưu trên máy tính"
          >
            <Download className="w-4 h-4" />
            <span>Tải Word (.doc)</span>
          </button>
        </div>
      </div>

      {/* NỘI DUNG FORM HOẶC PREVIEW */}
      {activeTab === 'preview' ? (
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-300">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-600 font-medium px-1">
            <span>Bản xem trước theo thể thức trang in A4 (font Times New Roman, cỡ 13pt):</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPdf}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> In ngay / Lưu PDF
              </button>
            </div>
          </div>
          <div className="bg-white shadow-md border border-slate-300 rounded-lg p-8 max-w-4xl mx-auto overflow-x-auto">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: generateDepartmentMeetingHtml(formData, schoolInfo, false) 
              }} 
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* PHẦN I: THÔNG TIN CUỘC HỌP */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h5 className="font-bold text-slate-900 text-sm">I. THÔNG TIN CUỘC HỌP & THỜI GIAN ĐỊA ĐIỂM</h5>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tổ chuyên môn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.departmentName}
                  onChange={e => setFormData({ ...formData, departmentName: e.target.value })}
                  placeholder="Ví dụ: TOÁN - TIN, NGỮ VĂN..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kỳ sinh hoạt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.meetingNumber}
                  onChange={e => setFormData({ ...formData, meetingNumber: e.target.value })}
                  placeholder="Ví dụ: lần 1, lần 2, tháng 9..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Năm học
                </label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa điểm họp
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Phòng họp tổ số 1..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Thời gian chi tiết */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Giờ bắt đầu</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={formData.timeHour}
                    onChange={e => setFormData({ ...formData, timeHour: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                    placeholder="08"
                  />
                  <span className="text-xs text-slate-500">giờ</span>
                  <input
                    type="text"
                    value={formData.timeMinute}
                    onChange={e => setFormData({ ...formData, timeMinute: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                    placeholder="00"
                  />
                  <span className="text-xs text-slate-500">phút</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ngày</label>
                <input
                  type="text"
                  value={formData.meetingDate}
                  onChange={e => setFormData({ ...formData, meetingDate: e.target.value })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                  placeholder="18"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tháng</label>
                <input
                  type="text"
                  value={formData.meetingMonth}
                  onChange={e => setFormData({ ...formData, meetingMonth: e.target.value })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                  placeholder="9"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Năm</label>
                <input
                  type="text"
                  value={formData.meetingYear}
                  onChange={e => setFormData({ ...formData, meetingYear: e.target.value })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                  placeholder="2026"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Giờ kết thúc</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={formData.endHour || '10'}
                    onChange={e => setFormData({ ...formData, endHour: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                    placeholder="10"
                  />
                  <span className="text-xs text-slate-500">:</span>
                  <input
                    type="text"
                    value={formData.endMinute || '30'}
                    onChange={e => setFormData({ ...formData, endMinute: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                    placeholder="30"
                  />
                </div>
              </div>
            </div>

            {/* Thành phần tham dự */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Thành phần tham dự & Nhân sự:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tổng số TV tổ</label>
                  <input
                    type="number"
                    value={formData.totalMembers}
                    onChange={e => handleMemberCountChange('totalMembers', parseInt(e.target.value) || 0)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Có mặt tham dự</label>
                  <input
                    type="number"
                    value={formData.presentMembers}
                    onChange={e => handleMemberCountChange('presentMembers', parseInt(e.target.value) || 0)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Số vắng</label>
                  <input
                    type="text"
                    value={formData.absentCount}
                    onChange={e => setFormData({ ...formData, absentCount: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Có phép</label>
                  <input
                    type="text"
                    value={formData.absentWithPermission}
                    onChange={e => setFormData({ ...formData, absentWithPermission: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg text-center"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Không phép</label>
                  <input
                    type="text"
                    value={formData.absentWithoutPermission}
                    onChange={e => setFormData({ ...formData, absentWithoutPermission: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg text-center"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Lý do vắng</label>
                  <input
                    type="text"
                    value={formData.absentReason}
                    onChange={e => setFormData({ ...formData, absentReason: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    placeholder="Nghỉ ốm / bận công tác..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chủ trì cuộc họp <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.chairPerson}
                      onChange={e => setFormData({ ...formData, chairPerson: e.target.value })}
                      placeholder="Thầy/Cô ... (Chủ trì)"
                      className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    />
                    <input
                      type="text"
                      value={formData.chairTitle || 'Tổ trưởng'}
                      onChange={e => setFormData({ ...formData, chairTitle: e.target.value })}
                      placeholder="Chức vụ"
                      className="w-28 text-xs px-2.5 py-2 border border-slate-300 rounded-lg text-center font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thư ký ghi biên bản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.secretary}
                    onChange={e => setFormData({ ...formData, secretary: e.target.value })}
                    placeholder="Thầy/Cô ... (Ghi rõ họ tên thư ký)"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN II: 1. ĐÁNH GIÁ HOẠT ĐỘNG CỦA TỔ */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="font-bold text-slate-900 text-sm">
                1. ĐÁNH GIÁ HOẠT ĐỘNG CỦA TỔ TRONG THỜI GIAN QUA
              </h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1">
                  - Ưu điểm:
                </label>
                <textarea
                  rows={3}
                  value={formData.reviewStrengths}
                  onChange={e => setFormData({ ...formData, reviewStrengths: e.target.value })}
                  placeholder="Các kết quả nổi bật, tinh thần trách nhiệm, hoàn thành tiến độ..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  - Hạn chế:
                </label>
                <textarea
                  rows={3}
                  value={formData.reviewWeaknesses}
                  onChange={e => setFormData({ ...formData, reviewWeaknesses: e.target.value })}
                  placeholder="Những tồn tại, hạn chế cần khắc phục..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  - Nguyên nhân của hạn chế:
                </label>
                <textarea
                  rows={2}
                  value={formData.reviewCauses}
                  onChange={e => setFormData({ ...formData, reviewCauses: e.target.value })}
                  placeholder="Khách quan, chủ quan..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-800 mb-1">
                  - Giải pháp khắc phục:
                </label>
                <textarea
                  rows={2}
                  value={formData.reviewSolutions}
                  onChange={e => setFormData({ ...formData, reviewSolutions: e.target.value })}
                  placeholder="Biện pháp khắc phục trong thời gian tới..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* PHẦN III: 2. TRIỂN KHAI CÁC VĂN BẢN */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                2. TRIỂN KHAI CÁC VĂN BẢN CHỈ ĐẠO
                <span className="text-[11px] font-normal text-slate-500">
                  (Đã nạp sẵn các văn bản cốt lõi Sở GDĐT và Nhà trường năm học 2026-2027)
                </span>
              </h5>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, documentsDeployed: DEFAULT_DEPARTMENT_MEETING_DOCUMENTS })}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
                title="Đặt lại văn bản mẫu gốc"
              >
                <RotateCcw className="w-3 h-3" /> Mẫu mặc định
              </button>
            </div>

            <textarea
              rows={5}
              value={formData.documentsDeployed}
              onChange={e => setFormData({ ...formData, documentsDeployed: e.target.value })}
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono leading-relaxed"
            />
          </div>

          {/* PHẦN IV: 3. TRIỂN KHAI CÔNG VIỆC TRỌNG TÂM VÀ BẢNG ĐIỂM */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="font-bold text-slate-900 text-sm">
                3. TRIỂN KHAI NỘI DUNG CÔNG VIỆC TRỌNG TÂM CỦA TRƯỜNG / TỔ
              </h5>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, centralTasks: DEFAULT_DEPARTMENT_MEETING_CENTRAL_TASKS })}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
                title="Đặt lại các công việc trọng tâm mẫu gốc"
              >
                <RotateCcw className="w-3 h-3" /> Mẫu mặc định
              </button>
            </div>

            <textarea
              rows={8}
              value={formData.centralTasks}
              onChange={e => setFormData({ ...formData, centralTasks: e.target.value })}
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
            />

            {/* Checkbox kèm bảng số cột điểm chuẩn */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <input
                type="checkbox"
                id="includeGradeTableCheck"
                checked={formData.includeGradeTable !== false}
                onChange={e => setFormData({ ...formData, includeGradeTable: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded mt-0.5"
              />
              <label htmlFor="includeGradeTableCheck" className="text-xs text-amber-950 font-medium cursor-pointer">
                <span className="font-bold">Đính kèm 2 bảng số cột điểm chuẩn THCS & THPT</span> theo công văn 1061 / 471 của Sở GDĐT (Hiển thị đầy đủ số tiết/năm, ĐG thường xuyên, giữa kỳ, cuối kỳ, nhận xét cho các bộ môn).
              </label>
            </div>
          </div>

          {/* PHẦN V: 4, 5, 6 Ý KIẾN, KẾT LUẬN VÀ KIẾN NGHỊ */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h5 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              4. Ý KIẾN CÁC THÀNH VIÊN, KẾT LUẬN & KIẾN NGHỊ
            </h5>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  4. Ý kiến của các thành viên trong cuộc họp đối với trường / tổ / cá nhân:
                </label>
                <textarea
                  rows={3}
                  value={formData.memberOpinions}
                  onChange={e => setFormData({ ...formData, memberOpinions: e.target.value })}
                  placeholder="Ghi nhận các ý kiến đóng góp, thảo luận của giáo viên trong tổ..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  5. Kết luận của chủ trì:
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    (Về các chỉ tiêu, nội dung trọng tâm cần thực hiện trong thời gian tới)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={formData.conclusion}
                  onChange={e => setFormData({ ...formData, conclusion: e.target.value })}
                  placeholder="Chỉ đạo của tổ trưởng về công tác chuyên môn, phân phối chương trình, bài dạy..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  6. Đề xuất, kiến nghị với nhà trường:
                </label>
                <textarea
                  rows={2}
                  value={formData.recommendations}
                  onChange={e => setFormData({ ...formData, recommendations: e.target.value })}
                  placeholder="Đề xuất về cơ sở vật chất, thiết bị dạy học, thời khóa biểu..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* HÀNH ĐỘNG DƯỚI ĐÁY FORM */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Dữ liệu biên bản được tự động lưu vào báo cáo nộp lên Ban Giám Hiệu.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPdf}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Xuất PDF / In</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadWord}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Word (.doc)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
