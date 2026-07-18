import { createHttpApp } from './interfaces/http/app';

const app = createHttpApp();

export default {
  fetch: app.fetch.bind(app),
};
