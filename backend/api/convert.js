// api/convert.js
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const form = new formidable.IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).send('Error parsing the file');

    const file = files.file[0];
    const filePath = file.filepath;
    const outputFile = `${filePath}.pdf`;

    exec(`libreoffice --headless --convert-to pdf ${filePath} --outdir /tmp`, (error) => {
      if (error) {
        return res.status(500).send('Conversion error');
      }

      const pdf = fs.readFileSync(outputFile);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdf);
    });
  });
}
