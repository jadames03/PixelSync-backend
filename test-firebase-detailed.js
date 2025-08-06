import { admin, db } from './firebase/firebaseAdmin.js';

async function testFirebaseServices() {
  console.log('🔍 Testing Firebase Services...\n');

  // Test 1: Firebase Admin SDK initialization
  try {
    console.log('1. Testing Firebase Admin SDK initialization...');
    const auth = admin.auth();
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.log('❌ Firebase Admin SDK failed:', error.message);
    return;
  }

  // Test 2: Firestore connection
  try {
    console.log('\n2. Testing Firestore connection...');
    const testDoc = await db.collection('test').doc('connection-test').get();
    console.log('✅ Firestore connection successful');
  } catch (error) {
    console.log('❌ Firestore connection failed:', error.message);
    console.log('\n📋 To fix this:');
    console.log('1. Go to: https://console.firebase.google.com/project/pixelsync-3f79a/firestore');
    console.log('2. Click "Create database"');
    console.log('3. Choose "Start in test mode"');
    console.log('4. Select a location and click "Done"');
    console.log('\nOR enable the API directly:');
    console.log('https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=pixelsync-3f79a');
    return;
  }

  // Test 3: Authentication service
  try {
    console.log('\n3. Testing Firebase Authentication...');
    const auth = admin.auth();
    // Try to list users (this will fail if auth is not enabled, but that's expected)
    await auth.listUsers(1);
    console.log('✅ Firebase Authentication service accessible');
  } catch (error) {
    if (error.code === 'auth/operation-not-allowed') {
      console.log('⚠️  Firebase Authentication service accessible (listUsers not allowed, which is normal)');
    } else {
      console.log('❌ Firebase Authentication failed:', error.message);
    }
  }

  // Test 4: Create a test document
  try {
    console.log('\n4. Testing Firestore write operation...');
    await db.collection('test').doc('write-test').set({
      test: true,
      timestamp: new Date()
    });
    console.log('✅ Firestore write operation successful');
  } catch (error) {
    console.log('❌ Firestore write operation failed:', error.message);
  }

  // Test 5: Read the test document
  try {
    console.log('\n5. Testing Firestore read operation...');
    const doc = await db.collection('test').doc('write-test').get();
    if (doc.exists) {
      console.log('✅ Firestore read operation successful');
    } else {
      console.log('⚠️  Test document not found (this might be normal)');
    }
  } catch (error) {
    console.log('❌ Firestore read operation failed:', error.message);
  }

  // Test 6: Clean up test document
  try {
    console.log('\n6. Cleaning up test documents...');
    await db.collection('test').doc('write-test').delete();
    console.log('✅ Cleanup successful');
  } catch (error) {
    console.log('⚠️  Cleanup failed (this is not critical):', error.message);
  }

  console.log('\n🎉 Firebase setup test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. If all tests passed, your Firebase setup is working correctly');
  console.log('2. If any tests failed, follow the instructions above to enable the required services');
  console.log('3. Run: npm start to start your server');
  console.log('4. Test authentication at: http://localhost:3000');
}

testFirebaseServices(); 