const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const convertApiSecret = process.env.secret_TUGLYp4Gk1l8tZqd;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Middleware
app.use(cors({
  origin: 'https://pdf-converter-nine.vercel.app', 
  methods: ['POST', 'GET'],
  credentials: true
}));
app.use(express.json());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Root Route
app.get('/', (req, res) => {
  res.send('🚀 PDF Converter API is running');
});

// Main Conversion Handler
const handleConversion = async (req, res, type) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const validExts = {
    docx: ['.docx'],
    ppt: ['.ppt', '.pptx']
  };

  // Validate extension
  if (!validExts[type].includes(ext)) {
    fs.unlinkSync(filePath);
    return res.status(400).send(`Invalid file type. Please upload a valid .${type} file.`);
  }

  try {
    const form = new FormData();
    form.append('File', fs.createReadStream(filePath));

    const convertApiUrl = `https://v2.convertapi.com/convert/${type}/to/pdf?Secret=${convertApiSecret}`;

    const convertResponse = await axios.post(convertApiUrl, form, {
      headers: form.getHeaders()
    });

    const downloadUrl = convertResponse?.data?.Files?.[0]?.Url;
    if (!downloadUrl) throw new Error('No download URL returned from ConvertAPI');

    const pdfResponse = await axios.get(downloadUrl, { responseType: 'stream' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');

    pdfResponse.data.pipe(res);
    pdfResponse.data.on('end', () => {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up: ${filePath}`);
    });

  } catch (err) {
    console.error('❌ Conversion error:', err.message || err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).send('Conversion failed. Please try again later.');
  }
};

// Routes
app.post('/api/convert/docx-to-pdf', upload.single('file'), (req, res) => {
  handleConversion(req, res, 'docx');
});

app.post('/api/convert/ppt-to-pdf', upload.single('file'), (req, res) => {
  handleConversion(req, res, 'ppt');
});

// Server start
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
