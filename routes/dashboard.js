import express from 'express';
import { admin, db } from '../firebase/firebaseAdmin.js';

const router = express.Router();

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  const idToken = req.cookies.authToken || req.headers.authorization?.split('Bearer ')[1];
  
  if (!idToken) {
    return res.redirect('/auth/login');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.redirect('/auth/login');
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: userDoc.data().name
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.redirect('/auth/login');
  }
};

// Apply authentication middleware to all dashboard routes
router.use(authenticateUser);

router.get('/', (req, res) => {
  res.render('dashboard', { user: req.user });
});

// Handle board creation
router.post('/create-board', (req, res) => {
  const { boardName, classCode, tags } = req.body;
  
  console.log('Creating new board:', {
    name: boardName,
    class: classCode,
    tags: tags,
    createdBy: req.user.uid
  });
  
  // Here you would typically:
  // 1. Validate the input data
  // 2. Generate a unique board ID
  // 3. Save to database with user info
  // 4. Redirect to the whiteboard with the new board ID
  
  // For now, let's just redirect to whiteboard
  // You can pass data via query parameters temporarily
  const queryParams = new URLSearchParams({
    name: boardName,
    class: classCode,
    tags: tags
  });
  
  res.redirect(`/whiteboard?${queryParams}`);
});

export default router;