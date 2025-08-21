import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("root", () => {
    it('should return "Server Service is running!"', () => {
      expect(appController.getHello()).toBe("Server Service is running!");
    });
  });

  describe("health", () => {
    it("should return health status", () => {
      const health = appController.getHealth();
      expect(health.status).toBe("ok");
      expect(health.service).toBe("server-service");
      expect(health.timestamp).toBeDefined();
    });
  });
});
