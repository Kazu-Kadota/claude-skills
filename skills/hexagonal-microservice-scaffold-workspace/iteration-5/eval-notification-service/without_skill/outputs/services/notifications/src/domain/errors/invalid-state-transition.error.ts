export class InvalidStateTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid state transition from '${from}' to '${to}'.`)
    this.name = 'InvalidStateTransitionError'
  }
}
