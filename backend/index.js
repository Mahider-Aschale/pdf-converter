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
const convertApiSecret = process.env.CONVERT_API_SECRET;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Middleware
app.use(cors({
  origin: 'https://pdf-converter-nine.vercel.app', // Your frontend URL
  methods: ['POST', 'GET'],
  credentials: true
}));
app.use(express.json());

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// --- Helper function to delete file safely ---
const safeDeleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🧹 Deleted file: ${filePath}`);
  }
};

// --- Conversion handler ---
const handleConversion = async (req, res, type) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  // Allowed extensions by type
  const validExts = {
    docx: ['.docx'],
    ppt: ['.ppt', '.pptx']
  };

  if (!validExts[type].includes(ext)) {
    safeDeleteFile(filePath);
    return res.status(400).send(`Invalid file type. Please upload a valid .${type} file.`);
  }

  try {
    // Prepare form-data for ConvertAPI
    const form = new FormData();
    form.append('File', fs.createReadStream(filePath));

    const convertApiUrl = `https://v2.convertapi.com/convert/${type}/to/pdf?Secret=${convertApiSecret}`;

    // Send conversion request
    const convertResponse = await axios.post(convertApiUrl, form, {
      headers: form.getHeaders()
    });

    console.log('🔍 ConvertAPI response:', convertResponse.data);

    // Extract download URL from response
    const downloadUrl = convertResponse.data.Files?.[0]?.Url || convertResponse.data.files?.[0]?.Url;

    if (!downloadUrl) throw new Error('No download URL returned from ConvertAPI');

    // Download the converted PDF as stream
    const pdfResponse = await axios.get(downloadUrl, { responseType: 'stream' });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');

    // Pipe the PDF stream directly to the client response
    pdfResponse.data.pipe(res);

    // Clean up uploaded file once streaming ends
    pdfResponse.data.on('end', () => safeDeleteFile(filePath));

  } catch (err) {
    console.error('Conversion error:', err.message || err);
    safeDeleteFile(filePath);
    res.status(500).send('Conversion failed. Please try again later.');
  }
};

// --- Routes ---
app.get('/', (req, res) => {
  res.send(' PDF Converter API is running');
});

app.post('/api/convert/docx-to-pdf', upload.single('file'), (req, res) => {
  handleConversion(req, res, 'docx');
});

app.post('/api/convert/ppt-to-pdf', upload.single('file'), (req, res) => {
  handleConversion(req, res, 'ppt');
});

// --- Start server ---
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
