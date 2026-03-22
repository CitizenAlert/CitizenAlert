import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../modules/users/entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('canActivate', () => {
    it('should return true if no roles are required', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: UserRole.CITIZEN } }),
        }),
        getHandler: () => ({}),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should return true if user has required role', () => {
      const requiredRoles = [UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: UserRole.ADMIN } }),
        }),
        getHandler: () => ({}),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user does not have required role', () => {
      const requiredRoles = [UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: UserRole.CITIZEN } }),
        }),
        getHandler: () => ({}),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user not found', () => {
      const requiredRoles = [UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
        getHandler: () => ({}),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user role is missing', () => {
      const requiredRoles = [UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: {} }),
        }),
        getHandler: () => ({}),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should return true if user has one of multiple allowed roles', () => {
      const requiredRoles = [UserRole.ADMIN, UserRole.MUNICIPALITY];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: UserRole.MUNICIPALITY } }),
        }),
        getHandler: () => ({}),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException with message "User role not found" when no user role', () => {
      const requiredRoles = [UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: {} }),
        }),
        getHandler: () => ({}),
      } as unknown as ExecutionContext;

      try {
        guard.canActivate(context);
        fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
      }
    });

    it('should throw ForbiddenException with message "Insufficient permissions" for wrong role', () => {
      const requiredRoles = [UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: UserRole.CITIZEN } }),
        }),
        getHandler: () => ({}),
      } as unknown as ExecutionContext;

      try {
        guard.canActivate(context);
        fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
      }
    });
  });
});
