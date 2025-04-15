import { Test, TestingModule } from '@nestjs/testing';
import { TransformfileService } from './transformfile.service';

describe('TransformfileService', () => {
  let service: TransformfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformfileService],
    }).compile();

    service = module.get<TransformfileService>(TransformfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
