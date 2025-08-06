// sign in / sign up page

import express from "express";
import { admin, db } from '../firebase/firebaseAdmin.js';

const router = express.Router();

// middleware/firebaseAuth.js
export const authenticateFirebaseToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) return res.status(401).send("No token provided");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send("Invalid token");
  }
};

router.get('/login', (req, res) => {
    res.render('auth', {FormType: 'login', layout: false});
});

router.get('/register', (req, res) => {
    res.render('auth', {FormType: 'register', layout: false});
});

router.post('/login', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Check if user exists in Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
            // User doesn't exist in Firestore, create them
            await db.collection('users').doc(uid).set({
                name: decodedToken.name || decodedToken.display_name || 'User',
                email: decodedToken.email,
                createdAt: new Date(),
                lastLogin: new Date()
            });
        } else {
            // Update last login time
            await db.collection('users').doc(uid).update({
                lastLogin: new Date()
            });
        }

        // Set session or cookie for authentication
        res.cookie('authToken', idToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
        console.error('Login error:', error);
        res.status(401).json({ error: 'Invalid token or authentication failed' });
    }
});

router.post('/register', async (req, res) => {
    console.log('Register route hit');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    console.log('Extracted token:', idToken ? 'Token present' : 'No token');
    
    if (!idToken) {
        console.log('No token provided, returning 401');
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        console.log('Verifying Firebase token...');
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const { name, email } = req.body;
        
        console.log('Token verified, UID:', uid);
        console.log('User data:', { name, email });

        // Check if user already exists in Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
            console.log('User already exists in Firestore');
            return res.status(400).json({ error: 'User already exists' });
        }

        console.log('Creating user in Firestore...');
        // Add user to Firestore
        await db.collection('users').doc(uid).set({
            name: name,
            email: email,
            createdAt: new Date(),
            lastLogin: new Date()
        });

        // Set session or cookie for authentication
        res.cookie('authToken', idToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        console.log('User registered successfully:', uid);
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
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Check if user is authenticated
router.get('/check-auth', async (req, res) => {
    const idToken = req.cookies.authToken || req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
        return res.status(401).json({ authenticated: false });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        
        if (!userDoc.exists) {
            return res.status(401).json({ authenticated: false });
        }

        res.json({ 
            authenticated: true,
            user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: userDoc.data().name
            }
        });
    } catch (error) {
        res.status(401).json({ authenticated: false });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true, message: 'Logged out successfully' });
});

export default router;