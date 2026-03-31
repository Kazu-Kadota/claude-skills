import { Body, Controller, Delete, Get, HttpCode, Param, Post } from "@nestjs/common";
import { NotificationService } from "./notification.service.js";
import { NotificationChannelType } from "../../../../domain/notification.js";

@Controller("notification")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async create(@Body() body: { recipientId: string; channel: NotificationChannelType; message: string }) {
    return await this.notificationService.createNotification(body);
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return await this.notificationService.getNotification(id);
  }

  @Delete(":id")
  @HttpCode(204)
  async delete(@Param("id") id: string) {
    await this.notificationService.deleteNotification(id);
  }
}
