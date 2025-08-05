import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  const expectedHtml = `<div>
        <b style="color:green;">Backend for Gramathupaal project</b>
        </div>`;

  const mockAppService = {
    getUser: jest.fn().mockReturnValue(expectedHtml),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('should return HTML from appService.getUser()', () => {
    const result = appController.getUser();
    expect(result).toBe(expectedHtml);
    expect(appService.getUser).toHaveBeenCalled();
  });
});
