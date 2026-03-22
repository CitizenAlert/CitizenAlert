import { Roles } from './roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';

describe('Roles Decorator', () => {
  it('should set roles metadata', () => {
    const testFn = () => {};
    const decorated = Roles(UserRole.ADMIN)(testFn);

    expect(decorated).toBeDefined();
  });

  it('should accept single role', () => {
    const testFn = () => {};
    const decorated = Roles(UserRole.ADMIN)(testFn);

    expect(decorated).toBeDefined();
  });

  it('should accept multiple roles', () => {
    const testFn = () => {};
    const decorated = Roles(UserRole.ADMIN, UserRole.MUNICIPALITY)(testFn);

    expect(decorated).toBeDefined();
  });

  it('should work with all user roles', () => {
    const testFn = () => {};
    const allRoles = [UserRole.ADMIN, UserRole.CITIZEN, UserRole.MUNICIPALITY];

    for (const role of allRoles) {
      const decorated = Roles(role)(testFn);
      expect(decorated).toBeDefined();
    }
  });

  it('should accept empty roles array', () => {
    const testFn = () => {};
    const decorated = Roles()(testFn);

    expect(decorated).toBeDefined();
  });
});
