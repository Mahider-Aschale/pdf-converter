// /api/convert.js

import formidable from 'formidable';
import fs from 'fs';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

export const config = {
  api: {
    bodyParser: false, // Required for formidable to work
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable Error:', err);
      return res.status(500).json({ error: 'File upload error' });
    }

    const docxFile = files.file;
    if (!docxFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = fs.readFileSync(docxFile.filepath);
      const { value: html } = await mammoth.convertToHtml({ buffer });

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      page.drawText(html.slice(0, 500)); // Simplified rendering

      const pdfBytes = await pdfDoc.save();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
      res.status(200).send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error('Conversion Error:', error);
      res.status(500).json({ error: 'Conversion failed' });
    }
  });
}
