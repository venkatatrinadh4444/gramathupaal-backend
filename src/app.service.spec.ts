import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the correct HTML string from getUser()', () => {
    const expectedHtml = `<div>
        <b style="color:green;">Backend for Gramathupaal project</b>
        </div>`;
    expect(service.getUser()).toBe(expectedHtml);
  });
});
