import { admin, db } from './firebase/firebaseAdmin.js';

async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase Admin SDK connection...');
    
    // Test Firestore connection
    const testDoc = await db.collection('test').doc('connection-test').get();
    console.log('✅ Firestore connection successful');
    
    // Test Auth connection
    const auth = admin.auth();
    console.log('✅ Firebase Auth connection successful');
    
    console.log('🎉 All Firebase services are working correctly!');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    console.error('Please check your AccountKey.json file and Firebase project settings.');
  }
}

testFirebaseConnection(); 