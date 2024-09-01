const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;


const upload = multer({ dest: 'uploads/' });


app.post('/upload-aadhaar', upload.single('aadhaarImage'), (req, res) => {

  
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }


  Tesseract.recognize(
    path.resolve(__dirname, file.path),
    'eng', 
    { logger: (m) => console.log(m) } 
  )
    .then(({ data: { text } }) => {
      
      fs.unlinkSync(file.path);

      
      const extractedInfo = extractAadhaarInfo(text);

      if (!extractedInfo) {
        return res.status(400).json({ error: 'Failed to extract Aadhaar information' });
      }

      
      res.json(extractedInfo);
    })
    .catch((err) => {
      console.error('Error processing OCR:', err);
      fs.unlinkSync(file.path); 
      res.status(500).json({ error: 'Error processing OCR' });
    });
});


function extractAadhaarInfo(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');

  let name = null;
  let aadhaarNumber = null;

  
  const aadhaarRegex = /\b\d{4}\s\d{4}\s\d{4}\b/;

  lines.forEach((line) => {
    
    if (aadhaarRegex.test(line)) {
      aadhaarNumber = line.match(aadhaarRegex)[0];
    }

    
    if (!aadhaarNumber && line.match(/^[A-Za-z ]+$/)) {
      name = line; 
    }
  });

  if (name && aadhaarNumber) {
    return { name, aadhaarNumber };
  }

  return null;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
