# Firebase Authentication & Firestore Setup Guide

---

## 1. Install Backend Dependencies

Open a terminal and run:
```bash
cd PixelSync-backend
npm install cookie-parser
```

---

## 2. Update Backend Server (`server.js`)

**Add this import at the top:**
```js
import cookieParser from "cookie-parser";
```

**Add this line after your other middleware:**
```js
app.use(cookieParser());
```

---

## 3. Fix Backend Authentication Routes (`routes/auth.js`)

**Replace your `/login` and `/register` routes with the following:**

```js
// LOGIN ROUTE
router.post('/login', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            await db.collection('users').doc(uid).set({
                name: decodedToken.name || decodedToken.display_name || 'User',
                email: decodedToken.email,
                createdAt: new Date(),
                lastLogin: new Date()
            });
        } else {
            await db.collection('users').doc(uid).update({
                lastLogin: new Date()
            });
        }
        res.cookie('authToken', idToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: {
                uid: uid,
                email: decodedToken.email,
                name: userDoc.exists ? userDoc.data().name : decodedToken.name || 'User'
            }
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token or authentication failed' });
    }
});

// REGISTER ROUTE
router.post('/register', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const { name, email } = req.body;
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            return res.status(400).json({ error: 'User already exists' });
        }
        await db.collection('users').doc(uid).set({
            name: name,
            email: email,
            createdAt: new Date(),
            lastLogin: new Date()
        });
        res.cookie('authToken', idToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ 
            success: true, 
            message: 'Registration successful!',
            user: {
                uid: uid,
                email: email,
                name: name
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
});
```

---

## 4. Add Authentication Middleware to Dashboard (`routes/dashboard.js`)

**At the top of the file:**
```js
import { admin, db } from '../firebase/firebaseAdmin.js';

const authenticateUser = async (req, res, next) => {
  const idToken = req.cookies.authToken || req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) return res.redirect('/auth/login');
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) return res.redirect('/auth/login');
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: userDoc.data().name
    };
    next();
  } catch (error) {
    res.redirect('/auth/login');
  }
};
router.use(authenticateUser);
```

---

## 5. Fix Frontend Firebase Loading (`views/auth.ejs`)

**Replace your Firebase script tags with:**
```html
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
  import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
  window.Firebase = {
    initializeApp,
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
  };
</script>
<script type="module" src="/js/auth.js"></script>
```

---

## 6. Update Frontend Authentication (`public/js/auth.js`)

**Replace your code with:**
```js
// Wait for Firebase to be available
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.Firebase) {
            resolve(window.Firebase);
        } else {
            const checkFirebase = () => {
                if (window.Firebase) {
                    resolve(window.Firebase);
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        }
    });
}
let auth = null;
async function initializeFirebase() {
    const Firebase = await waitForFirebase();
    const firebaseConfig = {
        apiKey: "AIzaSyBcMSzC2JU7RfV7tXcBRIseHJJCPpXLy8k",
        authDomain: "pixelsync-3f79a.firebaseapp.com",
        databaseURL: "https://pixelsync-3f79a-default-rtdb.firebaseio.com",
        projectId: "pixelsync-3f79a",
        storageBucket: "pixelsync-3f79a.firebasestorage.app",
        messagingSenderId: "670847612035",
        appId: "1:670847612035:web:d088453a46e185ac9457b6",
        measurementId: "G-Z1EEJC6SE3"
    };
    const app = Firebase.initializeApp(firebaseConfig);
    auth = Firebase.getAuth(app);
    setupEventListeners();
}
function setupEventListeners() {
    document.querySelector('form[action=\"/auth/login\"]')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.email.value;
        const password = form.password.value;
        try {
            const userCredential = await window.Firebase.signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ email })
            });
            const result = await response.json();
            if (result.success) {
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                alert(result.error || 'Login failed');
            }
        } catch (err) {
            alert(err.message || 'Login failed. Please check your credentials.');
        }
    });
    document.querySelector('form[action=\"/auth/register\"]')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const name = form.name.value;
        const email = form.email.value;
        const password = form.password.value;
        try {
            const userCredential = await window.Firebase.createUserWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ name, email })
            });
            const result = await response.json();
            if (result.success) {
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                alert(result.error || 'Registration failed');
            }
        } catch (err) {
            alert(err.message || 'Registration failed. Please try again.');
        }
    });
}
initializeFirebase();
```

---

## 7. Test Everything

1. Start the server:  
   ```bash
   node server.js
   ```
2. Go to [http://localhost:3000](http://localhost:3000)
3. Try registering a new account
4. Try logging in with the registered account

---

## Troubleshooting

- **"No token provided"**: Frontend is not sending the Firebase token to the backend.
- **"Firestore API not enabled"**: Enable Firestore in Firebase Console.
- **"Module not found"**: Firebase SDK not loading properly.
- **"Authentication failed"**: Check Firebase project settings.

**Check browser console and server logs for errors!**

---