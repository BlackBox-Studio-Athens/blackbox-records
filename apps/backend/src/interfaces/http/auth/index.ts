export {
  CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER,
  CF_ACCESS_JWT_ASSERTION_HEADER,
  verifyOperatorAccess,
} from './operator-identity';
export type { OperatorAccessResult } from './operator-identity';
export { operatorAccessMiddleware } from './operator-access-middleware';
