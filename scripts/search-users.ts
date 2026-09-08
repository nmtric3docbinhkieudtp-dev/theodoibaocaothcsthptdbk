import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json' with { type: 'json' };
import { OFFICIAL_USERS } from '../src/data/staffRoster.ts';

async function search() {
  const app = initializeApp({
    apiKey: appletConfig.apiKey,
    authDomain: appletConfig.authDomain,
    projectId: appletConfig.projectId,
    storageBucket: appletConfig.storageBucket,
    messagingSenderId: appletConfig.messagingSenderId,
    appId: appletConfig.appId,
  });
  const db = getFirestore(app, appletConfig.firestoreDatabaseId);

  console.log('--- Searching in OFFICIAL_USERS ---');
  const nyInOfficial = OFFICIAL_USERS.filter(u => u.name.includes('Ny'));
  console.log('Ny in OFFICIAL_USERS:', nyInOfficial);
  const thaoInOfficial = OFFICIAL_USERS.filter(u => u.name.includes('Thảo'));
  console.log('Thao in OFFICIAL_USERS:', thaoInOfficial);

  console.log('--- Checking users collection in Firestore ---');
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`Firestore has ${usersSnap.size} users.`);
    usersSnap.forEach(d => {
      const u = d.data();
      if (u.name?.includes('Ny') || u.name?.includes('Thảo')) {
        console.log(`Firestore User: ID=${d.id}, name=${u.name}, email=${u.email}, isHomeroom=${u.isHomeroomTeacher}, homeroomClass=${u.homeroomClass}`);
      }
    });
  } catch (e: any) {
    console.error('Error reading users:', e.message);
  }

  console.log('--- Checking all submissions in Firestore for Ny or Thao ---');
  try {
    const subsSnap = await getDocs(collection(db, 'submissions'));
    console.log(`Total submissions in Firestore: ${subsSnap.size}`);
    let matchedSubs = 0;
    subsSnap.forEach(d => {
      const s = d.data();
      if (
        s.authorName?.includes('Ny') || 
        s.authorName?.includes('Thảo') || 
        s.title?.includes('Ny') || 
        s.title?.includes('Thảo') ||
        nyInOfficial.some(u => u.id === s.authorId) ||
        thaoInOfficial.some(u => u.id === s.authorId)
      ) {
        matchedSubs++;
        console.log(`Found MATCHED SUBMISSION in Firestore: ID=${d.id}`, JSON.stringify(s, null, 2));
      }
    });
    if (matchedSubs === 0) {
      console.log('NO submissions found in Firestore for Ny or Thảo!');
    }
  } catch (e: any) {
    console.error('Error reading submissions:', e.message);
  }

  process.exit(0);
}

search();
