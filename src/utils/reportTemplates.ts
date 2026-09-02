export interface ReportTemplateOption {
  id: string;
  title: string;
  category: 'to_chuyen_mon' | 'bgh' | 'gvcn' | 'doan_doi' | 'chung';
  description: string;
  defaultTitle: string;
  content: string;
}

export const OFFICIAL_REPORT_TEMPLATES: ReportTemplateOption[] = [
  {
    id: 'tpl-to-chuyen-mon',
    title: 'Báo Cáo Công Tác Tổ Chuyên Môn (Tuần / Tháng)',
    category: 'to_chuyen_mon',
    description: 'Mẫu chuẩn đánh giá tiến độ dạy học, kiểm tra chuyên đề, bồi dưỡng HSG và phụ đạo',
    defaultTitle: 'Báo cáo công tác chuyên môn tháng ... - Tổ ...',
    content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập – Tự do – Hạnh phúc
---------------------------------
TRƯỜNG THCS & THPT ĐỐC BINH KIỀU
TỔ CHUYÊN MÔN: ...

BÁO CÁO CÔNG TÁC CHUYÊN MÔN THÁNG ... / NĂM HỌC 2026 – 2027

Kính gửi: Ban Giám Hiệu trường THCS & THPT Đốc Binh Kiều.

1. TÌNH HÌNH THỰC HIỆN QUY CHẾ CHUYÊN MÔN & TIẾN ĐỘ CHƯƠNG TRÌNH:
- Tổng số giáo viên trong tổ: ... GV.
- Thực hiện nghiêm túc phân phối chương trình môn học theo CT GDPT 2018.
- 100% giáo viên soạn giáo án đầy đủ, ký duyệt kế hoạch bài dạy trước khi lên lớp.
- Đã tổ chức ... tiết thao giảng, dự giờ rút kinh nghiệm trong tổ.

2. CÔNG TÁC BỒI DƯỠNG HỌC SINH GIỎI & PHỤ ĐẠO HỌC SINH YẾU:
- Bồi dưỡng HSG: Đang duy trì lịch bồi dưỡng ... buổi/tuần cho đội tuyển thi cấp Tỉnh.
- Phụ đạo học sinh yếu: Lập danh sách ... học sinh cần phụ đạo, đã tổ chức kiểm tra bù và hỗ trợ phương pháp tự học.

3. HOẠT ĐỘNG NGHIÊN CỨU KHOA HỌC, STEM & ĐỔI MỚI PHƯƠNG PHÁP:
- Đã triển khai ... chủ đề giáo dục STEM tại các khối lớp.
- Tích cực sử dụng thiết bị dạy học số và ứng dụng CNTT trong kiểm tra đánh giá.

4. NHỮNG TỒN TẠI, HẠN CHẾ & KHÓ KHĂN:
- Thiết bị phòng thực hành bộ môn còn thiếu một số hóa chất/dụng cụ.
- Một số học sinh chưa có ý thức tự học tốt ở nhà.

5. PHƯƠNG HƯỚNG CÔNG TÁC THÁNG TIẾP THEO:
- Tiếp tục duy trì nền nếp dạy học đúng tiến độ.
- Tổ chức kiểm tra giữa kỳ theo kế hoạch chung của nhà trường.

6. ĐỀ XUẤT, KIẾN NGHỊ BAN GIÁM HIỆU:
- Kính đề nghị BGH trang bị thêm một số đồ dùng dạy học thực hành cho tổ.`
  },
  {
    id: 'tpl-ke-hoach-tuan',
    title: 'Kế Hoạch & Lịch Công Tác Tuần / Tháng',
    category: 'chung',
    description: 'Bảng phân công nhiệm vụ, thời hạn hoàn thành và nhân sự phụ trách',
    defaultTitle: 'Kế hoạch công tác tuần ... - Trường THCS & THPT Đốc Binh Kiều',
    content: `TRƯỜNG THCS & THPT ĐỐC BINH KIỀU
BAN GIÁM HIỆU / BỘ PHẬN CHUYÊN MÔN

KẾ HOẠCH CÔNG TÁC TUẦN ... (Từ ngày ... đến ngày ...)

I. MỤC TIÊU TRỌNG TÂM:
1. Duy trì ổn định nền nếp dạy và học tại cả 2 cấp học (THCS và THPT).
2. Tăng cường kiểm tra chuyên đề và quản lý học sinh đầu giờ.
3. Hoàn tất công tác thống kê số liệu đầu năm học.

II. LỊCH CÔNG TÁC CỤ THỂ:
- Thứ Hai: Chào cờ đầu tuần; Họp Ban Giám Hiệu giao ban công tác tuần.
- Thứ Ba: Kiểm tra công tác hồ sơ sổ sách tổ chuyên môn; Dự giờ đột xuất.
- Thứ Tư: Tổ chức sinh hoạt chuyên đề STEM cấp trường.
- Thứ Năm: Khảo sát chất lượng học sinh khối 10 & khối 6.
- Thứ Sáu: Họp Tổ trưởng chuyên môn tổng kết tuần; Báo cáo Sở GD&ĐT.
- Thứ Bảy: Lao động vệ sinh trường lớp và chăm sóc cây xanh.

III. PHÂN CÔNG PHỤ TRÁCH:
- Thầy Lê Thanh Cường (Hiệu trưởng): Chỉ đạo chung toàn trường.
- Thầy Nguyễn Minh Trí (Phó Hiệu trưởng): Phụ trách công tác chuyên môn, kiểm tra nề nếp và CNTT.
- Thầy Phan Thanh Thảo (Phó Hiệu trưởng): Phụ trách cơ sở vật chất và phong trào đoàn thể.
- Thầy Nguyễn Thanh Tòng (Phó Hiệu trưởng): Phụ trách khối THCS và điểm trường phân hiệu.`
  },
  {
    id: 'tpl-so-ket-hoc-ky',
    title: 'Báo Cáo Sơ Kết / Tổng Kết Đánh Giá Chất Lượng',
    category: 'bgh',
    description: 'Thống kê kết quả học tập, rèn luyện, hạnh kiểm và danh hiệu thi đua',
    defaultTitle: 'Báo cáo sơ kết đánh giá chất lượng dạy và học HK...',
    content: `TRƯỜNG THCS & THPT ĐỐC BINH KIỀU

BÁO CÁO SƠ KẾT ĐÁNH GIÁ CÔNG TÁC GIÁO DỤC HỌC KỲ ...
NĂM HỌC 2026 – 2027

1. KẾT QUẢ RÈN LUYỆN ĐẠO ĐỨC & HẠNH KIỂM HỌC SINH:
- Tổng số học sinh toàn trường: ... học sinh / 53 lớp.
- Xếp loại Tốt: ... học sinh (đạt ...%).
- Xếp loại Khá: ... học sinh (đạt ...%).
- Xếp loại Đạt / Chưa đạt: ... học sinh (đạt ...%).

2. KẾT QUẢ HỌC TẬP VĂN HÓA:
- Xếp loại Xuất sắc: ... học sinh (đạt ...%).
- Xếp loại Giỏi: ... học sinh (đạt ...%).
- Xếp loại Khá: ... học sinh (đạt ...%).
- Xếp loại Đạt: ... học sinh (đạt ...%).

3. THÀNH TÍCH HỌC SINH GIỎI & CÁC CUỘC THI PHONG TRÀO:
- Đạt ... giải cấp Huyện / Tỉnh kỳ thi chọn HSG văn hóa.
- Đạt ... huy chương Hội khỏe Phù Đổng và Cuộc thi KHKT cấp Tỉnh.

4. ĐÁNH GIÁ CHUNG:
- Ưu điểm: Đội ngũ giáo viên đoàn kết, tâm huyết; nề nếp học sinh có nhiều chuyển biến tích cực.
- Tồn tại: Một số ít học sinh có hoàn cảnh gia đình khó khăn cần tiếp tục theo sát hỗ trợ.

5. PHƯƠNG HƯỚNG NHIỆM VỤ TRỌNG TÂM KỲ TIẾP THEO:
- Tập trung ôn tập cho học sinh khối 12 chuẩn bị kỳ thi Tốt nghiệp THPT.
- Nâng cao hiệu quả phụ đạo học sinh có học lực trung bình - yếu.`
  },
  {
    id: 'tpl-bien-ban-hop',
    title: 'Biên Bản Họp Cơ Quan / Họp Ban Giám Hiệu',
    category: 'chung',
    description: 'Mẫu ghi biên bản họp giao ban, lấy ý kiến biểu quyết và chỉ đạo',
    defaultTitle: 'Biên bản cuộc họp ... - Trường THCS & THPT Đốc Binh Kiều',
    content: `TRƯỜNG THCS & THPT ĐỐC BINH KIỀU

BIÊN BẢN CUỘC HỌP GIAO BAN BAN GIÁM HIỆU & TỔ TRƯỞNG

Thời gian: ... giờ ... ngày ... tháng ... năm 2026.
Địa điểm: Phòng họp Hội đồng sư phạm trường THCS & THPT Đốc Binh Kiều.
Chủ trì: Thầy Lê Thanh Cường – Hiệu trưởng.
Thư ký: ...
Thành phần tham dự: Ban Giám Hiệu và các Thầy/Cô Tổ trưởng chuyên môn.

NỘI DUNG CUỘC HỌP:
1. Đánh giá công tác trong thời gian qua:
...
2. Ý kiến đóng góp và thảo luận của các Tổ chuyên môn:
...
3. Kết luận và chỉ đạo của Chủ trì cuộc họp:
...

Cuộc họp kết thúc vào lúc ... giờ cùng ngày. Biên bản đã được thông qua toàn thể hội nghị thống nhất.`
  }
];
