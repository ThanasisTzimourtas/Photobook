"use client";

import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import { Download, PlusCircle, Palette, Layout, Image as ImageIcon, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  layout: string;
  photosPerPage: number;
}

interface BackgroundStyle {
  color: string;
  opacity: number;
}

const PhotoBook = () => {
  const [pages, setPages] = useState<PhotoPage[]>([]);
  const [title, setTitle] = useState<string>("");
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>();
  const [welcomeScreen, setWelcomeScreen] = useState(true);
  const [background, setBackground] = useState<BackgroundStyle>({
    color: "#F1F1F1",
    opacity: 1
  });
  const [currentLayout, setCurrentLayout] = useState("grid");
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [newPagePhotoCount, setNewPagePhotoCount] = useState<number>(2);

  const layouts = {
    grid: 'grid-cols-2 gap-4',
    single: 'grid-cols-1',
    featured: 'grid-cols-3 gap-2'
  };

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

  const handleCoverPhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addPage = () => {
    const newPage: PhotoPage = {
      photos: Array.from({ length: newPagePhotoCount }, () => ({ image: undefined, caption: "" })),
      sectionTitle: "",
      layout: currentLayout,
      photosPerPage: newPagePhotoCount
    };
    setPages([...pages, newPage]);
    setIsAddingPage(false);
  };

  const deletePage = (pageIndex: number) => {
    const updatedPages = pages.filter((_, index) => index !== pageIndex);
    setPages(updatedPages);
  };

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });



      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // Convert hex to RGB for PDF background
      const hex = background.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      // Cover Page
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text(title || "My PhotoBook", pageWidth / 2, 40, { align: "center" });

      // Cover Photo
      if (coverPhoto) {
        try {
          const img = new Image();
          img.src = coverPhoto;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const aspectRatio = img.width / img.height;
          const maxWidth = pageWidth - 2 * margin;
          const maxHeight = pageHeight - 80; // Leave space for title
          
          let imgWidth = maxWidth;
          let imgHeight = imgWidth / aspectRatio;
          
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * aspectRatio;
          }

          const x = (pageWidth - imgWidth) / 2;
          const y = 60;
          
          pdf.addImage(coverPhoto, 'JPEG', x, y, imgWidth, imgHeight);
        } catch (error) {
          console.error('Error loading cover photo:', error);
        }
      }

      // Content Pages
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        pdf.addPage();

        // Page background
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        // Section title
        if (page.sectionTitle) {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(18);
          pdf.setTextColor(0, 0, 0);
          pdf.text(page.sectionTitle, pageWidth / 2, margin, { align: "center" });
        }

        const titleSpace = page.sectionTitle ? 15 : 0;
        const availableHeight = pageHeight - (2 * margin) - titleSpace;
        const photosPerRow = page.layout === 'single' ? 1 : page.layout === 'featured' ? 3 : 2;
        const rows = Math.ceil(page.photos.length / photosPerRow);

        const photoWidth = (pageWidth - (2 * margin) - ((photosPerRow - 1) * 10)) / photosPerRow;
        const photoHeight = (availableHeight - ((rows - 1) * 10)) / rows;

        for (let photoIndex = 0; photoIndex < page.photos.length; photoIndex++) {
          const photo = page.photos[photoIndex];
          if (!photo.image) continue;

          const row = Math.floor(photoIndex / photosPerRow);
          const col = photoIndex % photosPerRow;

          const x = margin + (col * (photoWidth + 10));
          const y = margin + titleSpace + (row * (photoHeight + 10));

          try {
            // Background for photo
            pdf.setFillColor(r, g, b);
           // pdf.setFillOpacity(background.opacity);
            pdf.rect(x, y, photoWidth, photoHeight, 'F');
            //pdf.setFillOpacity(1);

            // Add photo
            const img = new Image();
            img.src = photo.image;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });

            const aspectRatio = img.width / img.height;
            let imgWidth = photoWidth;
            let imgHeight = imgWidth / aspectRatio;

            if (imgHeight > photoHeight) {
              imgHeight = photoHeight;
              imgWidth = imgHeight * aspectRatio;
            }

            const imgX = x + (photoWidth - imgWidth) / 2;
            const imgY = y + (photoHeight - imgHeight) / 2;

            pdf.addImage(photo.image, 'JPEG', imgX, imgY, imgWidth, imgHeight);

            // Add caption if exists
            if (photo.caption) {
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(10);
              pdf.setTextColor(0, 0, 0);
              pdf.text(photo.caption, x + photoWidth / 2, y + photoHeight + 5, { align: "center" });
            }
          } catch (error) {
            console.error(`Error processing photo ${photoIndex}:`, error);
            continue;
          }
        }
      }

      // Save the PDF
      pdf.save(`${title || 'photobook'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating your PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {welcomeScreen ? (
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4 text-primary">PhotoBook Creator</h2>
            <p className="text-gray-600 mb-8 text-lg">Create beautiful photo books with custom layouts</p>
            <Button
              onClick={() => setWelcomeScreen(false)}
              className="w-full py-6 text-lg"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      ) : pages.length === 0 ? (
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Setup Your PhotoBook</h2>
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium mb-2">Book Title</label>
                <input
                  type="text"
                  placeholder="My Beautiful Photobook"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border rounded-lg shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Cover Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  {coverPhoto ? (
                    <img src={coverPhoto} alt="Cover" className="max-h-full object-contain rounded-lg" />
                  ) : (
                    <div className="text-center">
                      <PlusCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">Upload Cover Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleCoverPhotoUpload(e.target.files[0])}
                  />
                </label>
              </div>

              <Dialog open={isAddingPage} onOpenChange={setIsAddingPage}>
                <DialogTrigger asChild>
                  <Button className="w-full py-6 text-lg">Create First Page</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Number of Photos</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-3 gap-4 py-4">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <Button
                        key={num}
                        variant={newPagePhotoCount === num ? "default" : "outline"}
                        onClick={() => setNewPagePhotoCount(num)}
                        className="h-20 text-lg"
                      >
                        {num} {num === 1 ? 'Photo' : 'Photos'}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={addPage} className="w-full">Create Page</Button>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Select value={currentLayout} onValueChange={setCurrentLayout}>
                  <SelectTrigger className="w-32">
                    <Layout className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Background
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Color</label>
                        <input
                          type="color"
                          value={background.color}
                          onChange={handleBackgroundColorChange}
                          className="w-full h-8 mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Opacity</label>
                        <Slider
                          value={[background.opacity]}
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

              <Button
                onClick={exportToPDF}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </Card>

          {pages.map((page, pageIndex) => (
            <Card key={pageIndex} className="p-6">
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    placeholder="Section Title (optional)"
                    value={page.sectionTitle || ""}
                    onChange={(e) => handleSectionTitleChange(pageIndex, e.target.value)}
                    className="text-xl font-semibold p-2 border rounded flex-grow mr-4"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deletePage(pageIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className={`grid ${layouts[page.layout]} gap-4`}>
                  {page.photos.map((photo, photoIndex) => (
                    <div key={photoIndex} className="aspect-square">
                      <label
                        className="flex flex-col items-center justify-center w-full h-full border rounded-lg cursor-pointer overflow-hidden"
                        style={{
                          backgroundColor: background.color,
                          opacity: background.opacity
                        }}
                      >
                        {photo.image ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={photo.image}
                              alt={`Photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <input
                              type="text"
                              placeholder="Add caption..."
                              value={photo.caption || ""}
                              onChange={(e) => handleCaptionChange(pageIndex, photoIndex, e.target.value)}
                              className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Upload Image</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) =>
                                e.target.files && handleImageUpload(pageIndex, photoIndex, e.target.files[0])
                              }
                            />
                          </>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Dialog open={isAddingPage} onOpenChange={setIsAddingPage}>
            <DialogTrigger asChild>
              <Button
                className="w-full mt-6 flex items-center justify-center gap-2 py-6"
                variant="outline"
              >
                <PlusCircle className="w-6 h-6" />
                Add New Page
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Number of Photos</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-4 py-4">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <Button
                    key={num}
                    variant={newPagePhotoCount === num ? "default" : "outline"}
                    onClick={() => setNewPagePhotoCount(num)}
                    className="h-20 text-lg"
                  >
                    {num} {num === 1 ? 'Photo' : 'Photos'}
                  </Button>
                ))}
              </div>
              <Button onClick={addPage} className="w-full">Create Page</Button>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default PhotoBook;