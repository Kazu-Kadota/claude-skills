export class NotificationNotFoundError extends Error {
  constructor(id: string) {
    super(`Notification with id '${id}' was not found.`)
    this.name = 'NotificationNotFoundError'
  }
}
