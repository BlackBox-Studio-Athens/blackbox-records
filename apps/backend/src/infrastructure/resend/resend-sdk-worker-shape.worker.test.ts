import { describe, expect, it } from 'vitest';
import { Resend } from 'resend';

describe('Resend SDK Worker toolchain shape', () => {
  it('imports the official SDK and exposes send, Contact, Topic, and Segment operations', () => {
    const resend = new Resend('re_mock_blackbox_local', {
      baseUrl: 'https://api.resend.com',
    });

    expect(typeof resend.emails.send).toBe('function');
    expect(typeof resend.contacts.create).toBe('function');
    expect(typeof resend.contacts.update).toBe('function');
    expect(typeof resend.contacts.topics.update).toBe('function');
    expect(typeof resend.contacts.topics.list).toBe('function');
    expect(typeof resend.contacts.segments.add).toBe('function');
  });
});
