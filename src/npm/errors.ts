export class NpmApiException extends Error {
  constructor(
    readonly code: number,
    message: string
  ) {
    super(`NPM API error ${code}: ${message}`);
  }
}
