import { auth, isFirestoreQuotaExceeded, markFirestoreQuotaExceeded } from '../lib/firebase';

export { isFirestoreQuotaExceeded, markFirestoreQuotaExceeded };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): boolean {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };

  const errMsg = errInfo.error.toLowerCase();
  const isOfflineOrUnavailable =
    errMsg.includes('unavailable') ||
    errMsg.includes('offline') ||
    errMsg.includes('could not reach cloud firestore backend') ||
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('quota exceeded') ||
    errMsg.includes('quota limit exceeded');

  if (isOfflineOrUnavailable) {
    markFirestoreQuotaExceeded();
    return true;
  }

  if (operationType === OperationType.GET || operationType === OperationType.LIST) {
    return true;
  }

  return true;
}
