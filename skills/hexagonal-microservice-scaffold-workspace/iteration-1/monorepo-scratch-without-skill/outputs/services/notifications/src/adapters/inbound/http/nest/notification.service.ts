import { Inject, Injectable } from "@nestjs/common";
import { CreateNotificationUseCase } from "../../../../application/use-cases/create-notification.js";
import { GetNotificationUseCase } from "../../../../application/use-cases/get-notification.js";
import { DeleteNotificationUseCase } from "../../../../application/use-cases/delete-notification.js";
import { NotificationDTO, NotificationChannelType } from "../../../../domain/notification.js";

@Injectable()
export class NotificationService {
  constructor(
    @Inject(CreateNotificationUseCase) private readonly createNotificationUseCase: CreateNotificationUseCase,
    @Inject(GetNotificationUseCase) private readonly getNotificationUseCase: GetNotificationUseCase,
    @Inject(DeleteNotificationUseCase) private readonly deleteNotificationUseCase: DeleteNotificationUseCase,
  ) {}

  async createNotification(input: { recipientId: string; channel: NotificationChannelType; message: string }): Promise<NotificationDTO> {
    return await this.createNotificationUseCase.execute(input);
  }

  async getNotification(id: string): Promise<NotificationDTO> {
    return await this.getNotificationUseCase.execute(id);
  }

  async deleteNotification(id: string): Promise<void> {
    await this.deleteNotificationUseCase.execute(id);
  }
}
