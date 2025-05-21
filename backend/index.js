const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const libre = require('libreoffice-convert');
const path = require('path');

const app = express();
const port = 5000;

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors( {
  origin: 'http://pdf-converter-nine.vercel.app',
  methods: ['POST', 'GET'],
  credentials: true

}));
app.use(express.json());

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// DOCX to PDF
app.post('/api/convert/docx-to-pdf', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const file = fs.readFileSync(filePath);
  libre.convert(file, '.pdf', undefined, (err, done) => {
    if (err) {
      console.error(`Error converting DOCX: ${err}`);
      return res.status(500).send('Conversion failed');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
    res.send(done);
  });
});

// PPT to PDF
app.post('/api/convert/ppt-to-pdf', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const file = fs.readFileSync(filePath);
  libre.convert(file, '.pdf', undefined, (err, done) => {
    if (err) {
      console.error(`Error converting PPT: ${err}`);
      return res.status(500).send('Conversion failed');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
    res.send(done);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
