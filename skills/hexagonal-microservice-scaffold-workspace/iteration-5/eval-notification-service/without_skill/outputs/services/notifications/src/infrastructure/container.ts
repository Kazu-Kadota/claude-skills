import { getPrismaClient } from './database/prisma/prisma.client'
import { NotificationPrismaRepository } from './database/prisma/notification.prisma-repository'
import { FcmPushAdapter } from './push/fcm/fcm-push.adapter'
import { CreateNotificationUseCase } from '../application/use-cases/create-notification/create-notification.use-case'
import { GetNotificationUseCase } from '../application/use-cases/get-notification/get-notification.use-case'
import { MarkAsSentUseCase } from '../application/use-cases/mark-as-sent/mark-as-sent.use-case'
import { MarkAsFailedUseCase } from '../application/use-cases/mark-as-failed/mark-as-failed.use-case'

export interface AppContainer {
  createNotificationUseCase: CreateNotificationUseCase
  getNotificationUseCase: GetNotificationUseCase
  markAsSentUseCase: MarkAsSentUseCase
  markAsFailedUseCase: MarkAsFailedUseCase
}

export function buildContainer(): AppContainer {
  // Infrastructure
  const prisma = getPrismaClient()
  const notificationRepository = new NotificationPrismaRepository(prisma)

  const pushAdapter = new FcmPushAdapter({
    projectId: process.env.FCM_PROJECT_ID ?? '',
    clientEmail: process.env.FCM_CLIENT_EMAIL ?? '',
    privateKey: process.env.FCM_PRIVATE_KEY ?? '',
  })

  // Use cases
  const createNotificationUseCase = new CreateNotificationUseCase(
    notificationRepository,
    pushAdapter,
  )
  const getNotificationUseCase = new GetNotificationUseCase(notificationRepository)
  const markAsSentUseCase = new MarkAsSentUseCase(notificationRepository)
  const markAsFailedUseCase = new MarkAsFailedUseCase(notificationRepository)

  return {
    createNotificationUseCase,
    getNotificationUseCase,
    markAsSentUseCase,
    markAsFailedUseCase,
  }
}
