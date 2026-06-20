import { getPortalMessagesPath, USER_ROLES } from '../userRoles';

describe('getPortalMessagesPath', () => {
  it('routes teachers to the teacher messaging section', () => {
    expect(getPortalMessagesPath(USER_ROLES.TEACHER)).toBe('/teacher/messages');
  });

  it('routes admins to the admin messaging section', () => {
    expect(getPortalMessagesPath(USER_ROLES.ADMIN)).toBe('/admin/messages');
  });

  it('keeps students in the student inbox', () => {
    expect(getPortalMessagesPath(USER_ROLES.STUDENT)).toBeNull();
  });
});
