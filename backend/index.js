const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors({
  origin: 'http://pdf-converter-nine.vercel.app',
  methods: ['POST', 'GET'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('PDF Converter API is running');
});

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

const convertToPdf = async (filePath, fromFormat, res) => {
  try {
    const form = new FormData();
    form.append('File', fs.createReadStream(filePath));

    const convertResponse = await axios.post(
      `https://v2.convertapi.com/convert/${fromFormat}/to/pdf?Secret=secret_TUGLYp4Gk1l8tZqd`,
      form,
      {
        headers: form.getHeaders(),
      }
    );

    const downloadUrl = convertResponse.data.Files[0].Url;

    const pdfResponse = await axios.get(downloadUrl, { responseType: 'stream' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
    pdfResponse.data.pipe(res);

    // Cleanup uploaded file
    pdfResponse.data.on('end', () => {
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Conversion failed:', error);
    res.status(500).send('Conversion failed');
  }
};

// DOCX to PDF
app.post('/api/convert/docx-to-pdf', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== '.docx') {
    fs.unlinkSync(filePath);
    return res.status(400).send('Invalid file type. Please upload a DOCX file.');
  }
  convertToPdf(filePath, 'docx', res);
});

// PPT to PDF
app.post('/api/convert/ppt-to-pdf', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== '.ppt') {
    fs.unlinkSync(filePath);
    return res.status(400).send('Invalid file type. Please upload a PPT file.');
  }
  convertToPdf(filePath, 'ppt', res);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
