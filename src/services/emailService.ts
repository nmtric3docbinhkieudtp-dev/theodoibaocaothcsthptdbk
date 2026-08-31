import { EmailLog, ReportPeriod, User, ReportSubmission } from '../types';
import { StorageService } from './storage';

export const EmailService = {
  // Build and dispatch a deadline reminder email
  sendDeadlineReminder(teacher: User, period: ReportPeriod, daysRemaining: number): EmailLog {
    const formattedDeadline = new Date(period.deadline).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const isOverdue = new Date(period.deadline).getTime() < Date.now();
    const subject = isOverdue
      ? `[CẢNH BÁO QUÁ HẠN] Báo cáo: ${period.title} - THCS&THPT Đốc Binh Kiều`
      : `[NHẮC NHỞ HẠN NỘP] Báo cáo: ${period.title} (Còn ${daysRemaining} ngày) - THCS&THPT Đốc Binh Kiều`;

    const content = `Kính gửi Quý Thầy/Cô: ${teacher.name} (${teacher.roleTitle} - ${teacher.departmentName}),

Hệ thống quản lý báo cáo Trường THCS & THPT Đốc Binh Kiều xin trân trọng thông báo:

1. TÊN ĐỢT BÁO CÁO: ${period.title}
2. THỜI HẠN CHÓT: ${formattedDeadline}
3. TÌNH TRẠNG HIỆN TẠI: ${isOverdue ? '⚠️ ĐÃ QUÁ THỜI HẠN QUY ĐỊNH' : `⏳ Còn khoảng ${daysRemaining} ngày`}
4. YÊU CẦU ĐÍNH KÈM: ${period.reportType === 'text_only' ? 'Nhập văn bản trực tiếp' : 'Tệp đính kèm văn bản/hình ảnh/bảng tính/bài trình chiếu'}

Quý Thầy/Cô vui lòng truy cập Hệ thống Cổng Nộp Báo Cáo của Nhà trường để hoàn tất việc nộp báo cáo đúng tiến độ.

Trân trọng!
Ban Giám Hiệu & Tổ Quản trị Công nghệ Thông tin
Trường THCS & THPT Đốc Binh Kiều - Tỉnh Đồng Tháp`;

    const emailLog: EmailLog = {
      id: 'email-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      toEmail: teacher.email,
      toName: teacher.name,
      subject,
      content,
      sentAt: new Date().toISOString(),
      status: 'sent',
      type: isOverdue ? 'overdue_alert' : 'deadline_reminder'
    };

    StorageService.logEmail(emailLog);

    // Also add in-app notification
    StorageService.addNotification({
      id: 'notif-' + Date.now(),
      userId: teacher.id,
      title: subject,
      message: `Hệ thống vừa gửi thông báo hạn nộp đợt "${period.title}" tới email ${teacher.email}. Hạn chót: ${formattedDeadline}.`,
      type: 'deadline_alert',
      linkId: period.id,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return emailLog;
  },

  // Bulk send reminder to all missing teachers in a period
  sendBulkRemindersForPeriod(period: ReportPeriod, missingUsers: User[]): EmailLog[] {
    const deadlineDate = new Date(period.deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const results: EmailLog[] = [];
    for (const user of missingUsers) {
      const log = this.sendDeadlineReminder(user, period, daysRemaining);
      results.push(log);
    }
    return results;
  },

  // Notify teacher of review outcome (approved / rejected)
  sendReviewOutcomeNotification(submission: ReportSubmission, reviewer: User, isApproved: boolean, comment: string): EmailLog {
    const subject = isApproved
      ? `[KẾT QUẢ DUYỆT] Báo cáo "${submission.title}" ĐÃ ĐƯỢC PHÊ DUYỆT`
      : `[YÊU CẦU CHỈNH SỬA] Báo cáo "${submission.title}" CẦN BỔ SUNG`;

    const content = `Kính gửi Thầy/Cô ${submission.authorName},

Báo cáo "${submission.title}" nộp cho đợt "${submission.periodTitle}" đã được xem xét bởi:
- Người duyệt: ${reviewer.name} (${reviewer.roleTitle})
- Trạng thái: ${isApproved ? 'ĐÃ DUYỆT' : 'YÊU CẦU BỔ SUNG / CHỈNH SỬA'}
- Ý kiến / Góp ý: "${comment || 'Không có ghi chú thêm.'}"

${!isApproved ? 'Quý Thầy/Cô vui lòng đăng nhập vào Cổng Báo Cáo để xem chi tiết góp ý và cập nhật lại báo cáo sớm nhất.' : 'Báo cáo của Quý Thầy/Cô đã được ghi nhận vào cơ sở dữ liệu nhà trường.'}

Trân trọng!
Trường THCS & THPT Đốc Binh Kiều`;

    const emailLog: EmailLog = {
      id: 'email-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      toEmail: submission.authorEmail,
      toName: submission.authorName,
      subject,
      content,
      sentAt: new Date().toISOString(),
      status: 'sent',
      type: 'review_result'
    };

    StorageService.logEmail(emailLog);

    StorageService.addNotification({
      id: 'notif-' + Date.now(),
      userId: submission.authorId,
      title: subject,
      message: `${reviewer.name} (${reviewer.roleTitle}): "${comment || (isApproved ? 'Đã duyệt' : 'Cần bổ sung')}"`,
      type: isApproved ? 'review_approved' : 'review_rejected',
      linkId: submission.id,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return emailLog;
  }
};
