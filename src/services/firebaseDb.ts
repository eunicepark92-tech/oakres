import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const APP_STATE_DOC_PATH = {
  collection: 'app_settings',
  doc: 'main_state',
};

/**
 * Listen for real-time changes to the shared app state from Firebase Firestore.
 */
export function subscribeToFirebaseAppState(onUpdate: (state: any, updatedAt: string) => void) {
  const docRef = doc(db, APP_STATE_DOC_PATH.collection, APP_STATE_DOC_PATH.doc);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.state) {
          onUpdate(data.state, data.updatedAt || new Date().toISOString());
        }
      }
    },
    (error) => {
      console.error('[Firestore Realtime Error]', error);
    }
  );
}

/**
 * Fetch current state once from Firestore.
 */
export async function getFirebaseAppState(): Promise<{ state: any; updatedAt: string } | null> {
  try {
    const docRef = doc(db, APP_STATE_DOC_PATH.collection, APP_STATE_DOC_PATH.doc);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        state: data.state,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.error('[Firestore Get State Error]', error);
    return null;
  }
}

/**
 * Save updated state directly to Firebase Firestore.
 */
export async function saveFirebaseAppState(state: any): Promise<boolean> {
  try {
    const docRef = doc(db, APP_STATE_DOC_PATH.collection, APP_STATE_DOC_PATH.doc);
    const updatedAt = new Date().toISOString();
    await setDoc(docRef, {
      state,
      updatedAt,
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[Firestore Save State Error]', error);
    return false;
  }
}
