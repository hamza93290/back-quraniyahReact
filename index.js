import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';



// Initialiser Firebase Admin avec la clé de service
config(); // Charge les variables d’environnement

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
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
    const snapshot = await db.collection('eleves').get();
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
      pass: 'bSqYKbLYhpbPW5umih4F' // ou mot de passe d'application si nécessaire
    }
  });

    const mailOptions = {
      from: 'admin@institutquraniyah.fr',
      to: email,
      subject: 'Bienvenue sur notre plateforme',
      html: `
        <h3>Bonjour ${name} ${lastname},</h3>
        <p>Votre inscription a bien été prise en compte !</p>
      `
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


const JWT_SECRET = '6d14845ef59dac1ec742ed2c17c64a691f1e2877cd5ff72bf9cf8a085501880ff0240c82e5759fd49246d3f54d95b186fcbe781de4e8c3760c63a5018ca03f59'; // stocke-la dans une variable d’environnement en prod

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
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.send({ token });
});

import * as functions from 'firebase-functions';
export const api = functions.https.onRequest(app);