export abstract class INotificationsTelemetryPort {
  abstract span<T>(name: string, fn: () => Promise<T>): Promise<T>;
}
