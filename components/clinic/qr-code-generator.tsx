"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2 } from "lucide-react";
import { useRef } from "react";

export function QRCodeGenerator({ url, clinicName }: { url: string, clinicName: string }) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${clinicName}-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code</CardTitle>
        <CardDescription>Generate a QR code for your public page.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div ref={qrRef} className="p-4 bg-white rounded-lg shadow-sm border">
          <QRCodeSVG value={url} size={200} level="H" includeMargin={true} />
        </div>
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={downloadQR}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button className="flex-1" onClick={() => navigator.share({ title: clinicName, url })}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
