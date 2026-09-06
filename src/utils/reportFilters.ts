import { User, ReportPeriod, TargetAudienceType } from '../types';

/**
 * Check if a user is eligible to submit or view a specific report period
 */
export function isUserEligibleForPeriod(user: User, period: ReportPeriod): boolean {
  // If user is Admin or Principal, they have oversight access to all periods
  // but for actual submission eligibility:
  
  // 0. Specific individual users target (Chỉ định đích danh từng cá nhân)
  if (period.targetAudience === 'specific_users') {
    return Boolean(period.targetUserIds && period.targetUserIds.includes(user.id));
  }

  // 1. Homeroom Teachers target
  if (period.targetAudience === 'homeroom_teachers') {
    return Boolean(user.isHomeroomTeacher);
  }

  // 2. Department heads only (Chỉ Tổ trưởng & Tổ phó chuyên môn - 19 Thầy/Cô)
  if (period.targetAudience === 'dept_heads_only') {
    if (user.departmentId === 'van_phong' && (!period.targetDepartmentIds || !period.targetDepartmentIds.includes('van_phong'))) {
      return false;
    }
    if (user.departmentId === 'bgh' || user.role === 'principal' || user.role === 'admin') {
      return false;
    }
    return user.role === 'dept_head';
  }

  // 3. Office staff only
  if (period.targetAudience === 'staff_only') {
    return user.departmentId === 'van_phong';
  }

  // 4. Teaching staff only (excluding office staff)
  if (period.targetAudience === 'teachers_only') {
    if (user.departmentId === 'van_phong') return false;
    return user.role === 'teacher' || user.role === 'dept_head';
  }

  // 5. Check target department IDs
  if (period.targetDepartmentIds && period.targetDepartmentIds.length > 0 && !period.targetDepartmentIds.includes('all')) {
    if (!period.targetDepartmentIds.includes(user.departmentId)) {
      return false;
    }
  }

  // 6. Check target roles
  if (period.targetRoles && period.targetRoles.length > 0) {
    if (!period.targetRoles.includes(user.role)) {
      return false;
    }
  }

  return true;
}

/**
 * Get all users who are required to submit for a given period
 */
export function getRequiredUsersForPeriod(period: ReportPeriod, allUsers: User[]): User[] {
  if (period.targetAudience === 'specific_users') {
    const userIds = period.targetUserIds || [];
    return allUsers.filter(u => userIds.includes(u.id));
  }
  return allUsers.filter(user => {
    // Exclude BGH from standard required lists unless explicitly targeted
    if (user.role === 'principal' || (user.role === 'admin' && user.id === 'staff-2')) {
      return false;
    }
    return isUserEligibleForPeriod(user, period);
  });
}

/**
 * Return friendly label for target audience
 */
export function getAudienceLabel(audience?: TargetAudienceType, depts?: string[], targetUserIds?: string[]): string {
  switch (audience) {
    case 'homeroom_teachers':
      return 'Chỉ 53 Giáo viên chủ nhiệm (GVCN)';
    case 'dept_heads_only':
      return 'Chỉ Tổ trưởng & Tổ phó chuyên môn (19 Thầy/Cô)';
    case 'teachers_only':
      return 'Tất cả Giáo viên bộ môn';
    case 'staff_only':
      return 'Nhân viên Tổ Văn phòng';
    case 'specific_users':
      return `Chỉ định đích danh (${targetUserIds?.length || 0} Thầy/Cô)`;
    case 'all':
    default:
      if (depts && depts.length > 0 && !depts.includes('all')) {
        return `Theo ${depts.length} Tổ chuyên môn chỉ định`;
      }
      return 'Toàn trường (Tất cả cán bộ, GV, NV)';
  }
}
