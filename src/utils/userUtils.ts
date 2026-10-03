/**
 * Chuyển họ và tên thành Tên Đăng Nhập viết liền, chữ thường, không dấu.
 * Quy tắc do Ban Giám Hiệu quy định:
 * Ví dụ: "Nguyễn Minh Trí" -> "nguyenminhtri"
 *        "Huỳnh Thanh Dân" -> "huynhthanhdan"
 *        "Phan Thị Ngọc Thơ" -> "phanthingoctho"
 */
export function toUsername(fullName?: string): string {
  if (!fullName) return '';
  return fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Chuẩn hóa chuỗi tìm kiếm không dấu
 */
export function normalizeVietnamese(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}
