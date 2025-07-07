import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import https from 'https';
import fs from 'fs';
import { FieldValue } from 'firebase-admin/firestore';
import generateWelcomeEmail from './mail.js';

// Initialiser Firebase Admin avec la clé de service
config(); // Charge les variables d’environnement

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/api.institutquraniyah.fr/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/api.institutquraniyah.fr/fullchain.pem')
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ➕ Ajouter un document
app.post('/admin', async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection('admin').add(data);
    res.status(201).send({ id: docRef.id });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// 📄 Récupérer tous les documents
app.get('/admin', async (req, res) => {
  try {
    const snapshot = await db.collection('admin').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// 📄 Récupérer tous les documents
app.get('/eleves/get', async (req, res) => { 
  try {
    const snapshot = await db
      .collection('eleves')
      .orderBy('createdAt', 'desc')
      .get();

    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// // ❌ Supprimer un document
app.get('/admin/:id', async (req, res) => {
  try {
    await db.collection('admin').doc(req.params.id).get();
    res.send({ success: true });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/admin/:id', async (req, res) => {
  try {
    const adminRef = db.collection('admin').doc(req.params.id);
    const adminDoc = await adminRef.get();

    if (!adminDoc.exists) {
      return res.status(404).send({ error: 'Admin non trouvé' });
    }

    const adminData = adminDoc.data();
    res.send({
      id: adminDoc.id,
      ...adminData
    });

  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ❌ ajouter un eleve
// app.post('/eleves/save', async (req, res) => {
//   const {age, cursus,email,lastname,name,telephone } = req.body;

//   const docRef = await db.collection('eleves').add({
//     age, cursus ,email ,lastname ,name ,telephone
//   });

//   res.send({ success: true, id: docRef.id });
// });

app.post('/eleves/save', async (req, res) => {
  const { age, cursus, email, lastname, name, telephone } = req.body;

  try {
    // Enregistrer dans Firestore
    const docRef = await db.collection('eleves').add({
      age, cursus, email, lastname, name, telephone
    });

    // Configurer nodemailer
    const transporter = nodemailer.createTransport({
      host: 'ssl0.ovh.net',
      port: 587,
      secure: false, // STARTTLS
    auth: {
      user: 'admin@institutquraniyah.fr',
      pass: process.env.MAIL_PASS 
    }
  });

    const mailOptions = {
      from: 'admin@institutquraniyah.fr',
      to: email,
      subject: 'Bienvenue sur notre plateforme',
      html:  generateWelcomeEmail(name, lastname)
    };

    await transporter.sendMail(mailOptions);

    res.send({ success: true, id: docRef.id });

  } catch (error) {
    console.error('Erreur lors de l’inscription ou l’envoi du mail :', error);
    res.status(500).send({ error: error.message });
  }
});

// ❌ ajouter un admin
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  const docRef = await db.collection('admin').add({
    username,
    password: hash
  });

  res.send({ success: true, id: docRef.id });
});



app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const snapshot = await db.collection('admin')
    .where('username', '==', username)
    .get();

  if (snapshot.empty) {
    return res.status(401).send({ error: 'Nom d’utilisateur invalide' });
  }

  const adminDoc = snapshot.docs[0];
  const adminData = adminDoc.data();

  const isValid = await bcrypt.compare(password, adminData.password);

  if (!isValid) {
    return res.status(401).send({ error: 'Mot de passe invalide' });
  }

  const token = jwt.sign(
    { id: adminDoc.id, username: adminData.username },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.send({ token });
});


https.createServer(options, app).listen(3000, () => {
  console.log('HTTPS Server running on port 3000');
});