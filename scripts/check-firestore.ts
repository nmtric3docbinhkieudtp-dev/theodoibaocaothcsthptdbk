import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json' with { type: 'json' };

async function check() {
  console.log('Connecting to Firebase with config:', appletConfig.projectId, appletConfig.firestoreDatabaseId);
  const app = initializeApp({
    apiKey: appletConfig.apiKey,
    authDomain: appletConfig.authDomain,
    projectId: appletConfig.projectId,
    storageBucket: appletConfig.storageBucket,
    messagingSenderId: appletConfig.messagingSenderId,
    appId: appletConfig.appId,
  });

  const db = getFirestore(app, appletConfig.firestoreDatabaseId);

  console.log('--- Checking submissions collection ---');
  try {
    const subsSnap = await getDocs(collection(db, 'submissions'));
    console.log(`Found ${subsSnap.size} submissions in Firestore.`);
    subsSnap.forEach(doc => {
      const data = doc.data();
      console.log(`Sub: ID=${doc.id}, authorId=${data.authorId}, authorName=${data.authorName}, periodId=${data.periodId}, title=${data.title}, status=${data.status}, submittedAt=${data.submittedAt}`);
    });
  } catch (err: any) {
    console.error('Error fetching submissions:', err.message);
  }

  console.log('--- Checking periods collection ---');
  try {
    const periodsSnap = await getDocs(collection(db, 'periods'));
    console.log(`Found ${periodsSnap.size} periods in Firestore.`);
    periodsSnap.forEach(doc => {
      const data = doc.data();
      console.log(`Period: ID=${doc.id}, title=${data.title}, status=${data.status}, target=${data.targetAudience}`);
    });
  } catch (err: any) {
    console.error('Error fetching periods:', err.message);
  }

  process.exit(0);
}

check();
