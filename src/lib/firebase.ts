import {initializeApp} from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt: 'select_account'});

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export interface StudentProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  defaultHostelBlock?: string;
  defaultRoomNumber?: string;
}

export async function loadStudentProfile(uid: string): Promise<StudentProfile | null> {
  const path = `users/${uid}/private/profile`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'private', 'profile'));
    if (!snap.exists()) return null;
    return snap.data() as StudentProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveStudentProfile(profile: StudentProfile): Promise<void> {
  const path = `users/${profile.uid}/private/profile`;
  const payload: Record<string, unknown> = {
    uid: profile.uid,
    displayName: profile.displayName.slice(0, 100),
    email: profile.email.slice(0, 160),
    updatedAt: serverTimestamp(),
  };
  if (profile.phone && profile.phone.trim()) {
    payload.phone = profile.phone.trim().slice(0, 20);
  }
  if (profile.defaultHostelBlock && profile.defaultHostelBlock.trim()) {
    payload.defaultHostelBlock = profile.defaultHostelBlock.trim().slice(0, 100);
  }
  if (profile.defaultRoomNumber && profile.defaultRoomNumber.trim()) {
    payload.defaultRoomNumber = profile.defaultRoomNumber.trim().slice(0, 20);
  }

  try {
    await setDoc(doc(db, 'users', profile.uid, 'private', 'profile'), payload, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface FirestoreOrderRecord {
  docId: string;
  userId: string;
  orderCode: string;
  customerName: string;
  phone: string;
  hostelBlock: string;
  roomNumber: string;
  slot: string;
  paymentMethod: 'UPI' | 'Cash on Delivery';
  itemLines: string[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: 'Confirmed' | 'Out for Hostel Drop' | 'Delivered' | 'Cancelled';
  createdAtMs: number;
}

export function subscribeUserOrders(
  userId: string,
  onOrders: (orders: FirestoreOrderRecord[]) => void,
  onError: (error: Error) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: FirestoreOrderRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | undefined;
        return {
          docId: d.id,
          userId: String(data.userId ?? ''),
          orderCode: String(data.orderCode ?? ''),
          customerName: String(data.customerName ?? ''),
          phone: String(data.phone ?? ''),
          hostelBlock: String(data.hostelBlock ?? ''),
          roomNumber: String(data.roomNumber ?? ''),
          slot: String(data.slot ?? ''),
          paymentMethod: data.paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : 'UPI',
          itemLines: Array.isArray(data.itemLines) ? data.itemLines.map(String) : [],
          subtotal: Number(data.subtotal ?? 0),
          discount: Number(data.discount ?? 0),
          deliveryFee: Number(data.deliveryFee ?? 0),
          total: Number(data.total ?? 0),
          status:
            (data.status as FirestoreOrderRecord['status']) ?? 'Confirmed',
          createdAtMs: ts?.toMillis ? ts.toMillis() : Date.now(),
        };
      });
      records.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onOrders(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function createFirestoreOrder(input: {
  userId: string;
  orderCode: string;
  customerName: string;
  phone: string;
  hostelBlock: string;
  roomNumber: string;
  slot: string;
  paymentMethod: 'UPI' | 'Cash on Delivery';
  itemLines: string[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}): Promise<string> {
  const orderId = `${input.orderCode.replace(/[^a-zA-Z0-9_-]/g, '')}_${Date.now()}`;
  const path = `orders/${orderId}`;
  try {
    await setDoc(doc(db, 'orders', orderId), {
      userId: input.userId,
      orderCode: input.orderCode.slice(0, 24),
      customerName: input.customerName.slice(0, 100),
      phone: input.phone.slice(0, 20),
      hostelBlock: input.hostelBlock.slice(0, 100),
      roomNumber: input.roomNumber.slice(0, 20),
      slot: input.slot.slice(0, 60),
      paymentMethod: input.paymentMethod,
      itemLines: input.itemLines.slice(0, 25),
      subtotal: Math.max(0, input.subtotal),
      discount: Math.max(0, input.discount),
      deliveryFee: Math.max(0, input.deliveryFee),
      total: Math.max(0, input.total),
      status: 'Confirmed',
      createdAt: serverTimestamp(),
    });
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelFirestoreOrder(orderDocId: string): Promise<void> {
  const path = `orders/${orderDocId}`;
  try {
    await updateDoc(doc(db, 'orders', orderDocId), {
      status: 'Cancelled',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
