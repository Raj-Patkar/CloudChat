const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const Busboy = require('busboy');
const crypto = require('crypto');

const storage = new Storage();
const bucket = storage.bucket('cloudchat-uploads'); // Replace with your actual bucket name if different

functions.http('uploadImage', (req, res) => {
  console.log('📩 Received request');

  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('⚙️ OPTIONS preflight');
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).send('Method Not Allowed');
  }

  const busboy = Busboy({ headers: req.headers });
  const fileData = [];
  let filename = '';
  let mimetype = '';

  busboy.on('file', (fieldname, file, fname, encoding, mime) => {
    console.log(`📦 Receiving file: ${fname}`);
    filename = fname || `image-${crypto.randomBytes(6).toString('hex')}.jpg`;
    mimetype = mime;

    file.on('data', (data) => {
      fileData.push(data);
    });
  });

  busboy.on('finish', async () => {
    const buffer = Buffer.concat(fileData);
    if (!buffer.length) {
      console.log('⚠️ No file data received.');
      return res.status(400).send('No file uploaded.');
    }

    const filePath = `uploads/${Date.now()}-${filename}`;
    const blob = bucket.file(filePath);

    try {
      await blob.save(buffer, {
        resumable: false,
        contentType: mimetype,
        public: true, // ✅ Ensures it’s publicly accessible
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      console.log('✅ Upload successful:', publicUrl);
      res.status(200).json({ url: publicUrl });

    } catch (err) {
      console.error('💥 Upload error:', err);
      res.status(500).send('Upload failed.');
    }
  });

  req.pipe(busboy);
});
