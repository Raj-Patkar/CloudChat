const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('cloudchat-uploads'); // change to your bucket name

const Busboy = require('busboy'); // For parsing form-data

functions.http('uploadImage', (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const busboy = Busboy({ headers: req.headers });
  const fileData = [];

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    file.on('data', (data) => {
      fileData.push(data);
    });

    file.on('end', () => {
      const buffer = Buffer.concat(fileData);
      const blob = bucket.file(`uploads/${Date.now()}-${filename}`);
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: { contentType: mimetype }
      });

      blobStream.on('error', (err) => {
        console.error(err);
        res.status(500).send(err);
      });

      blobStream.on('finish', async () => {
        // Make file public
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        res.status(200).json({ url: publicUrl });
      });

      blobStream.end(buffer);
    });
  });

  busboy.end(req.rawBody);
});
