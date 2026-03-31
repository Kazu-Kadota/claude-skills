import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { NotificationChannel } from "../../../../../domain/notification.js";
import type { NotificationChannelType } from "../../../../../domain/notification.js";

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannelType;

  @IsString()
  @IsNotEmpty()
  message!: string;
}
