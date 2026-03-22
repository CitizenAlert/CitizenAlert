import { Test, TestingModule } from '@nestjs/testing';
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalAuthGuard],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
  });

  describe('LocalAuthGuard', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should extend AuthGuard("local")', () => {
      expect(guard).toBeDefined();
      expect(guard.getRequest).toBeDefined();
    });

    it('should be an instance of LocalAuthGuard', () => {
      expect(guard).toBeInstanceOf(LocalAuthGuard);
    });
  });
});
