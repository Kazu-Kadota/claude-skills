export abstract class IReviewsTelemetryPort {
  abstract span<T>(name: string, fn: () => Promise<T>): Promise<T>;
}
