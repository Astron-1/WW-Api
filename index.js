const express = require('express');

const app = express();
const port = process.env.port || 3000;

// const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
require('dotenv').config();

var admin = require("firebase-admin");

var serviceAccount = require("./AcKey.json");
const bucketURL="gs://wardrobe-wizard-01.appspot.com";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: bucketURL, 
});


const db = admin.firestore();

const storage = admin.storage();
// const bucket = storage.bucket();

const expiration = new Date();
expiration.setDate(expiration.getDate() + 7);

app.get('/get-images', async (req, res) => {
  try {
    const snapshot = await db.collection('images').get();
    const data = snapshot.docs.map(doc => doc.data());

    const imagesWithLinks = await Promise.all(data.map(async item => {
      const filePath = item.path;
      const fileName = filePath.split('/').pop();
      const bucket = storage.bucket();
      const fileRef = bucket.file(fileName);
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires:expiration,
      });
      return {
        downloadLink: url,
      };
    }));

    res.json(imagesWithLinks);
    res.status(200)
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.listen(port, () => console.log('Example app is listening on port 3000.'));


