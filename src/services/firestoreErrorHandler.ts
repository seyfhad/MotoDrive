import { auth } from '../lib/firebase';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
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

  const isOfflineOrUnavailable =
    errInfo.error.includes('unavailable') ||
    errInfo.error.includes('offline') ||
    errInfo.error.includes('Could not reach Cloud Firestore backend');

  if (isOfflineOrUnavailable) {
    console.info(`Firestore operating in resilient offline/cache mode for [${path || 'operation'}].`);
    return;
  }

  if (operationType === OperationType.GET || operationType === OperationType.LIST) {
    console.warn(`Firestore read notice [${path}]:`, errInfo.error);
    return;
  }

  console.error('Firestore Operation Error:', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}
