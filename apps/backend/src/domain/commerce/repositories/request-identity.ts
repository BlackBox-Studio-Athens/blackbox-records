export type RequestIdentity = {
  keyDigest: string;
  requestFingerprint: string;
  productEnvironment: string;
};

export class RequestIdentityConflictError extends Error {
  public constructor(message = 'The request key was already used for different input.') {
    super(message);
    this.name = 'RequestIdentityConflictError';
  }
}
