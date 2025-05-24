 import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import axios from 'axios';

export default function PdfConverter() {
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [pptFile, setPptFile] = useState<File | null>(null);

  const handleDocxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocxFile(e.target.files[0]);
    }
  };


  const handlePptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPptFile(e.target.files[0]);
    }
  };



  const convertDocxToPdf = async () => {
    if (!docxFile) return;

    const formData = new FormData();
    formData.append("file", docxFile);

    const response = await axios.post("https://pdf-converter-serverside.onrender.com/api/convert/docx-to-pdf", formData, {
      responseType: "blob",
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    

  
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${docxFile.name}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const convertPptToPdf = async () => {
    if (!pptFile) return;

    const formData = new FormData();
    formData.append("file", pptFile);

    const response = await axios.post("https://pdf-converter-serverside.onrender.com/api/convert/docx-to-pdf", formData, {
      responseType: "blob",
    });

    
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${pptFile.name}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="py-12 md:py-16">
        <h2 className="text-2xl font-bold text-[#2C3E50]">DOCX to PDF</h2>
        <div className="flex items-center justify-center gap-11 mb-8 text-[#2C3E50]">
          <Input type="file" accept=".docx" onChange={handleDocxChange} />
          <Button onClick={convertDocxToPdf} disabled={!docxFile}>
            Convert DOCX to PDF
          </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-12 md:py-16 ">    
          <h2 className="text-2xl font-bold text-[#2C3E50]">PPT to PDF</h2>
        <div className="flex items-center justify-center gap-11 mb-8 text-[#2C3E50] ">

          <Input type="file" accept=".ppt,.pptx" onChange={handlePptChange} />
          <Button onClick={convertPptToPdf} disabled={!pptFile}>
            Convert PPT to PDF
          </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
