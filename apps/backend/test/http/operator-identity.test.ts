import { describe, expect, it } from 'vitest';

import {
  CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER,
  readOperatorIdentityFromAccessHeaders,
} from '../../src/interfaces/http/auth';

describe('readOperatorIdentityFromAccessHeaders', () => {
  it('returns null when the Access email header is missing', () => {
    const headers = new Headers();

    expect(readOperatorIdentityFromAccessHeaders(headers)).toBeNull();
  });

  it('returns null when the Access email header is blank', () => {
    const headers = new Headers({
      [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: '   ',
    });

    expect(readOperatorIdentityFromAccessHeaders(headers)).toBeNull();
  });

  it('returns the authenticated operator email from Access headers', () => {
    const headers = new Headers({
      'Cf-Access-Authenticated-User-Email': 'operator@blackboxrecords.example',
    });

    expect(readOperatorIdentityFromAccessHeaders(headers)).toEqual({
      email: 'operator@blackboxrecords.example',
    });
  });
});
