import http from 'node:http';
import https from 'node:https';
import { syncBuiltinESMExports } from 'node:module';
import { afterAll } from 'vitest';

const savedFetch = globalThis.fetch;
const savedHttpRequest = http.request;
const savedHttpGet = http.get;
const savedHttpsRequest = https.request;
const savedHttpsGet = https.get;
const message = 'Lightweight web test attempted an unmocked network request.';
const rejectRequest = () => {
  throw new Error(message);
};
const rejectFetch = async () => {
  throw new Error(message);
};

globalThis.fetch = rejectFetch as typeof fetch;
http.request = rejectRequest as typeof http.request;
http.get = rejectRequest as typeof http.get;
https.request = rejectRequest as typeof https.request;
https.get = rejectRequest as typeof https.get;
syncBuiltinESMExports();

afterAll(() => {
  globalThis.fetch = savedFetch;
  http.request = savedHttpRequest;
  http.get = savedHttpGet;
  https.request = savedHttpsRequest;
  https.get = savedHttpsGet;
  syncBuiltinESMExports();
});
