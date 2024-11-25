"use client";

import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { Download, PlusCircle, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

interface Photo {
  image?: string;
  caption?: string;
}

interface PhotoPage {
  photos: Photo[];
  sectionTitle?: string;
}

interface BackgroundStyle {
  color: string;
  opacity: number;
}

const PhotoBook: React.FC = () => {
  const [photosPerPage, setPhotosPerPage] = useState<number | null>(null);
  const [pages, setPages] = useState<PhotoPage[]>([]);
  const [title, setTitle] = useState<string>("");
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>();
  const [welcomeScreen, setWelcomeScreen] = useState(true);
  const [background, setBackground] = useState<BackgroundStyle>({
    color: "#F1F1F1",
    opacity: 1
  });

  const handleImageUpload = (pageIndex: number, photoIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const updatedPages = [...pages];
      updatedPages[pageIndex].photos[photoIndex].image = reader.result as string;
      setPages(updatedPages);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptionChange = (pageIndex: number, photoIndex: number, caption: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].photos[photoIndex].caption = caption;
    setPages(updatedPages);
  };

  const handleSectionTitleChange = (pageIndex: number, sectionTitle: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].sectionTitle = sectionTitle;
    setPages(updatedPages);
  };

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackground(prev => ({
      ...prev,
      color: e.target.value
    }));
  };

  const handleOpacityChange = (value: number[]) => {
    setBackground(prev => ({
      ...prev,
      opacity: value[0]
    }));
  };

  const addPage = () => {
    if (photosPerPage !== null) {
      const newPage: PhotoPage = {
        photos: Array.from({ length: photosPerPage }, () => ({ image: undefined, caption: "" })),
        sectionTitle: "",
      };
      setPages([...pages, newPage]);
    }
  };

  const handleCoverPhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const exportToPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Convert hex to RGB for PDF background
    const hex = background.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const margin = 20;
    const spacing = 10;
    const titleSpace = 30;
    const minCaptionHeight = 10;
    const lineHeight = 5;
    const maxCaptionLines = 4;
    
    const availableWidth = pageWidth - (2 * margin);
    const availableHeight = pageHeight - (2 * margin) - titleSpace;
    
    const cols = 2;
    const rows = Math.ceil(photosPerPage! / 2);
    
    const gridWidth = (availableWidth - spacing) / cols;

    // Calculate background color with opacity
    const bgColor = {
      r: r + (255 - r) * (1 - background.opacity),
      g: g + (255 - g) * (1 - background.opacity),
      b: b + (255 - b) * (1 - background.opacity)
    };

    // Title Page
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text(title || "My Photobook", pageWidth / 2, 40, { align: "center" });

    if (coverPhoto) {
      const img = new Image();
      img.src = coverPhoto;
      const aspectRatio = img.width / img.height;
      const imgWidth = Math.min(pageWidth - 2 * margin, (pageHeight / 2) * aspectRatio);
      const imgHeight = imgWidth / aspectRatio;
      const x = (pageWidth - imgWidth) / 2;
      const y = 50;
      pdf.addImage(img, x, y, imgWidth, imgHeight);
    }

    // Content Pages
    pages.forEach((page) => {
      pdf.addPage();

      if (page.sectionTitle) {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(18);
        pdf.text(page.sectionTitle, pageWidth / 2, margin + 10, { align: "center" });
      }

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const captionHeights: number[] = page.photos.map(photo => {
        if (!photo.caption) return minCaptionHeight;
        const captionWidth = gridWidth - 10;
        const lines = pdf.splitTextToSize(photo.caption, captionWidth);
        return Math.min(lines.length, maxCaptionLines) * lineHeight + 5;
      });

      const maxCaptionHeightsPerRow: number[] = [];
      for (let i = 0; i < rows; i++) {
        const rowCaptions = captionHeights.slice(i * 2, (i + 1) * 2);
        maxCaptionHeightsPerRow[i] = Math.max(...rowCaptions);
      }

      const totalCaptionHeight = maxCaptionHeightsPerRow.reduce((a, b) => a + b, 0);
      const gridHeight = (availableHeight - (spacing * (rows - 1)) - totalCaptionHeight) / rows;

      page.photos.forEach((photo, photoIndex) => {
        const col = photoIndex % 2;
        const row = Math.floor(photoIndex / 2);
        
        const previousRowsCaptionHeight = maxCaptionHeightsPerRow
          .slice(0, row)
          .reduce((a, b) => a + b, 0);
        
        const x = margin + (col * (gridWidth + spacing));
        const y = margin + titleSpace + 
                 (row * (gridHeight + spacing)) + 
                 previousRowsCaptionHeight;

        // Apply background with opacity
        pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
        pdf.rect(x, y, gridWidth, gridHeight, "F");

        if (photo.image) {
          const img = new Image();
          img.src = photo.image;
          const aspectRatio = img.width / img.height;
          
          let imgWidth = gridWidth;
          let imgHeight = gridWidth / aspectRatio;
          
          if (imgHeight > gridHeight) {
            imgHeight = gridHeight;
            imgWidth = gridHeight * aspectRatio;
          }
          
          const offsetX = x + (gridWidth - imgWidth) / 2;
          const offsetY = y + (gridHeight - imgHeight) / 2;
          
          pdf.addImage(img, offsetX, offsetY, imgWidth, imgHeight);
        }

        if (photo.caption) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          
          const captionWidth = gridWidth - 10;
          const lines = pdf.splitTextToSize(photo.caption, captionWidth);
          const truncatedLines = lines.slice(0, maxCaptionLines);
          
          truncatedLines.forEach((line: string, lineIndex: number) => {
            pdf.text(
              line,
              x + gridWidth / 2,
              y + gridHeight + 5 + (lineIndex * lineHeight),
              { align: "center" }
            );
          });
        }
      });
    });

    pdf.save("photobook.pdf");
  };

  const initializePages = () => {
    if (photosPerPage && photosPerPage > 0) {
      const initialPage: PhotoPage = {
        photos: Array.from({ length: photosPerPage }, () => ({ image: undefined, caption: "" })),
        sectionTitle: "",
      };
      setPages([initialPage]);
    }
  };

  const startApp = () => {
    setWelcomeScreen(false);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Welcome Screen */}
      {welcomeScreen && (
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">Welcome to the Photobook App!</h2>
            <p className="text-gray-600 mb-4">Click below to start creating your photobook.</p>
            <Button
              onClick={startApp}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Start
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Title and Cover Photo */}
      {!welcomeScreen && photosPerPage === null && (
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">Enter a title for your photobook</h2>
            <input
              type="text"
              placeholder="My Beautiful Photobook"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mb-4 p-2 border border-gray-300 rounded-md text-black"
            />
            <h2 className="text-lg font-semibold mb-4">Upload a cover photo (optional)</h2>
            <label className="flex flex-col items-center justify-center w-full h-64 cursor-pointer border border-gray-300 rounded-md bg-gray-200">
              {coverPhoto ? (
                <img src={coverPhoto} alt="Cover" className="max-w-full max-h-full object-contain" />
              ) : (
                <>
                  <PlusCircle size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Upload Cover Photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files && handleCoverPhotoUpload(e.target.files[0])
                }
              />
            </label>
            <h2 className="text-lg font-semibold mt-4">How many photos per page?</h2>
            <div className="flex justify-center space-x-4">
              {[2, 3, 4].map((num) => (
                <Button
                  key={num}
                  onClick={() => {
                    setPhotosPerPage(num);
                    initializePages();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                  {num}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main App */}
      {!welcomeScreen && photosPerPage !== null && (
        <>
          {/* Background Controls */}
          <Card className="w-full max-w-4xl p-4">
            <div className="flex items-center space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Background Style
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={background.color}
                          onChange={handleBackgroundColorChange}
                          className="w-full h-8 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Opacity</label>
                      <Slider
                        defaultValue={[background.opacity]}
                        max={1}
                        step={0.1}
                        onValueChange={handleOpacityChange}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </Card>

          {/* Photo Pages */}
          <div className="flex flex-col space-y-6 w-full max-w-4xl">
            {pages.map((page, pageIndex) => (
              <div key={pageIndex} className="flex flex-col space-y-4 p-4 border border-gray-300 rounded-md bg-gray-50">
                <input
                  type="text"
                  placeholder="Section Title (optional)"
                  value={page.sectionTitle || ""}
                  onChange={(e) => handleSectionTitleChange(pageIndex, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-black"
                />
                <div className="grid grid-cols-2 gap-4">
                  {page.photos.map((photo, photoIndex) => (
                    <div key={photoIndex} className="flex flex-col space-y-2">
                      <label 
                        className="flex flex-col items-center justify-center w-full h-32 border border-gray-300 rounded-md cursor-pointer"
                        style={{
                          backgroundColor: background.color,
                          opacity: background.opacity
                        }}
                      >
                        {photo.image ? (
                          <img src={photo.image} alt="Uploaded" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <>
                            <PlusCircle size={24} className="text-gray-400" />
                            <span className="text-sm text-gray-500">Upload Photo</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                  onChange={(e) =>
                            e.target.files && handleImageUpload(pageIndex, photoIndex, e.target.files[0])
                          }
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Caption (optional)"
                        value={photo.caption || ""}
                        onChange={(e) => handleCaptionChange(pageIndex, photoIndex, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-black"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Add Page Button */}
            <div
              onClick={addPage}
              className="flex flex-col items-center justify-center border border-gray-300 rounded-md p-4 bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <PlusCircle size={32} className="text-gray-400" />
              <span className="text-sm text-gray-500">Add Page</span>
            </div>
          </div>

          {/* Export to PDF Button */}
          <Button
            onClick={exportToPDF}
            className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors mb-8"
          >
            <Download size={16} className="mr-2" />
            Export PDF
          </Button>
        </>
      )}
    </div>
  );
};

export default PhotoBook;