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


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// connect with frontend to vercel
app.use(cors({
  origin: 'https://pdf-converter-nine.vercel.app', 
  methods: ['POST', 'GET'],
  credentials: true
}));
app.use(express.json());

// setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Helper: Delete file safely
const safeDeleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted file: ${filePath}`);
  }
};

// Handle file conversion
const handleConversion = async (req, res, type) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  const validExts = {
    docx: ['.docx'],
    ppt: ['.ppt', '.pptx']
  };

  if (!validExts[type].includes(ext)) {
    safeDeleteFile(filePath);
    return res.status(400).send(`Invalid file type. Please upload a valid .${type} file.`);
  }

  try {
    const form = new FormData();
    form.append('File', fs.createReadStream(filePath));

    const convertApiUrl = `https://v2.convertapi.com/convert/${type}/to/pdf?Secret=${convertApiSecret}`;

    const convertResponse = await axios.post(convertApiUrl, form, {
      headers: form.getHeaders()
    });

    console.log('ConvertAPI response:', convertResponse.data);

    const file = convertResponse.data.Files?.[0];
    const downloadUrl = file?.Url;
    const fileDataBase64 = file?.FileData;

    if (downloadUrl) {
      const pdfResponse = await axios.get(downloadUrl, { responseType: 'stream' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');

      pdfResponse.data.pipe(res);
      pdfResponse.data.on('end', () => safeDeleteFile(filePath));

    } else if (fileDataBase64) {
      const buffer = Buffer.from(fileDataBase64, 'base64');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');

      res.send(buffer);
      safeDeleteFile(filePath);
    } else {
      throw new Error('Neither Url nor FileData found in ConvertAPI response.');
    }

  } catch (err) {
    console.error(' Conversion error:', err.message || err);
    safeDeleteFile(filePath);
    res.status(500).send('Conversion failed. Please try again later.');
  }
};

// Routes
app.get('/', (req, res) => {
  res.send(' PDF Converter API is running');
});

app.post('/api/convert/docx-to-pdf', upload.single('file'), (req, res) => {
  handleConversion(req, res, 'docx');
});

app.post('/api/convert/ppt-to-pdf', upload.single('file'), (req, res) => {
  handleConversion(req, res, 'ppt');
});

// Start server
app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
});
