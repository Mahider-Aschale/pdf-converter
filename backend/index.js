const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors({
  origin: 'https://pdf-converter-nine.vercel.app',
  methods: ['POST', 'GET'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('PDF Converter API is running');
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Helper function for conversion
const handleConversion = async (req, res, type) => {
  try {
    if (!req.file) {
      console.error('❌ No file uploaded.');
      return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const validExts = { docx: '.docx', ppt: '.ppt', pptx: '.pptx' };

    // Check for correct file type
    if (!Object.values(validExts).includes(ext)) {
      console.warn(`⚠️ Invalid file type uploaded: ${ext}`);
      fs.unlinkSync(filePath);
      return res.status(400).send(`Invalid file type. Please upload a .${type.toUpperCase()} file.`);
    }

    console.log(`✅ Received file for ${type.toUpperCase()} to PDF conversion:`, filePath);

    const form = new FormData();
    form.append('File', fs.createReadStream(filePath));

    const convertApiUrl = `https://v2.convertapi.com/convert/${type}/to/pdf?Secret=secret_TUGLYp4Gk1l8tZqd`;

    const convertResponse = await axios.post(convertApiUrl, form, {
      headers: form.getHeaders()
    });

    const downloadUrl = convertResponse?.data?.Files?.[0]?.Url;
    if (!downloadUrl) {
      throw new Error('No download URL returned from ConvertAPI');
    }

    console.log(`📥 Downloading PDF from: ${downloadUrl}`);

    const pdfResponse = await axios.get(downloadUrl, { responseType: 'stream' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
    pdfResponse.data.pipe(res);
    pdfResponse.data.on('end', () => {
      fs.unlinkSync(filePath);
      console.log(`🧹 Deleted temp file: ${filePath}`);
    });

  } catch (err) {
    console.error(`❌ Conversion failed:`, err.message || err);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path); // Clean up if possible
    }
    res.status(500).send('Conversion failed. Please try again.');
  }
};

// DOCX to PDF
app.post('/api/convert/docx-to-pdf', upload.single('file'), (req, res) => {
  handleConversion(req, res, 'docx');
});

// PPT to PDF
app.post('/api/convert/ppt-to-pdf', upload.single('file'), (req, res) => {
  handleConversion(req, res, 'ppt');
});

// Start server
app.listen(port, () => {
  console.log(` Server is running at http://localhost:${port}`);
});
