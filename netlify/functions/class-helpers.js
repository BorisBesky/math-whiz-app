/**
 * Shared helpers for multi-teacher class support.
 * Supports both old (teacherId: string) and new (teacherIds: string[]) formats.
 */

function getTeacherIds(classData) {
  if (Array.isArray(classData.teacherIds) && classData.teacherIds.length > 0) {
    return classData.teacherIds;
  }
  return classData.teacherId ? [classData.teacherId] : [];
}

function isTeacherOnClass(classData, uid) {
  return getTeacherIds(classData).includes(uid);
}

module.exports = { getTeacherIds, isTeacherOnClass };
