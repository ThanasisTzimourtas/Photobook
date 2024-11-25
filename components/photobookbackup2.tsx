"use client";

import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import { 
  Download, PlusCircle, Palette, Layout, Image as ImageIcon, 
  X, Type, Move, Copy, Trash2, Save, Undo, Redo, Filter 
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button, ButtonProps } from "@/components/ui/button";
import Image from 'next/image';
import {
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";

interface Photo {
  id: string;
  image?: string;
  caption?: string;
  text?: string;
  isText: boolean;
  filter?: string;
  rotation?: number;
}

interface PhotoPage {
  id: string;
  photos: Photo[];
  sectionTitle?: string;
  layout: string;
  photosPerPage: number;
  backgroundColor?: string;
  backgroundOpacity?: number;
}

interface BackgroundStyle {
  color: string;
  opacity: number;
}

interface LayoutClasses {
  [key: string]: string;
  grid: string;
  single: string;
  featured: string;
  masonry: string;
  carousel: string;
}

type ButtonVariant = ButtonProps['variant'];

const generateId = () => Math.random().toString(36).substr(2, 9);

const filters = {
  none: 'None',
  grayscale: 'Grayscale',
  sepia: 'Sepia',
  blur: 'Blur',
  brightness: 'Bright',
  contrast: 'High Contrast'
};

const getFilterStyle = (filter?: string) => {
  switch (filter) {
    case 'grayscale': return 'grayscale(100%)';
    case 'sepia': return 'sepia(100%)';
    case 'blur': return 'blur(2px)';
    case 'brightness': return 'brightness(120%)';
    case 'contrast': return 'contrast(120%)';
    default: return 'none';
  }
};

const layouts = {
  grid: 'Grid Layout',
  single: 'Single Photo',
  featured: 'Featured Gallery',
  masonry: 'Masonry Grid',
  carousel: 'Carousel'
};

const layoutClasses: LayoutClasses = {
  grid: 'grid-cols-2 gap-4',
  single: 'grid-cols-1',
  featured: 'grid-cols-3 gap-2',
  masonry: 'columns-2 gap-4',
  carousel: 'flex overflow-x-auto gap-4'
};

const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  if (typeof window !== 'undefined') {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = src;
    });
  }
  return Promise.resolve({ width: 500, height: 500 });
};

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
  const [history, setHistory] = useState<PhotoPage[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);

  useEffect(() => {
    const savedBook = localStorage.getItem('photobook');
    if (savedBook) {
      const { pages: savedPages, title: savedTitle, coverPhoto: savedCover } = JSON.parse(savedBook);
      setPages(savedPages);
      setTitle(savedTitle);
      setCoverPhoto(savedCover);
    }
  }, []);

  useEffect(() => {
    if (!welcomeScreen && title && coverPhoto && pages.length === 0) {
      setIsAddingPage(true);
    }
  }, [welcomeScreen, title, coverPhoto, pages.length]);

  const handleCoverPhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPhoto(reader.result as string);
      addToHistory(pages);
    };
    reader.readAsDataURL(file);
    toast({
      title: "Cover photo updated",
      description: "Your photobook cover has been updated successfully",
    });
  };

  const handleSectionTitleChange = (pageIndex: number, sectionTitle: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].sectionTitle = sectionTitle;
    setPages(updatedPages);
    addToHistory(updatedPages);
  };

  const toggleContentType = (pageIndex: number, photoIndex: number) => {
    const updatedPages = [...pages];
    const photo = updatedPages[pageIndex].photos[photoIndex];
    photo.isText = !photo.isText;
    if (photo.isText) {
      photo.image = undefined;
    } else {
      photo.text = "";
    }
    setPages(updatedPages);
    addToHistory(updatedPages);
  };

  const addToHistory = (newPages: PhotoPage[]) => {
    const newHistory = [...history.slice(0, historyIndex + 1), newPages];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleImageUpload = (pageIndex: number, photoIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const updatedPages = [...pages];
      updatedPages[pageIndex].photos[photoIndex] = {
        ...updatedPages[pageIndex].photos[photoIndex],
        image: reader.result as string,
        isText: false
      };
      setPages(updatedPages);
      addToHistory(updatedPages);
    };
    reader.readAsDataURL(file);
  };

  const handleTextContent = (pageIndex: number, photoIndex: number, text: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].photos[photoIndex] = {
      ...updatedPages[pageIndex].photos[photoIndex],
      text,
      isText: true
    };
    setPages(updatedPages);
    addToHistory(updatedPages);
  };

  const handleCaptionChange = (pageIndex: number, photoIndex: number, caption: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].photos[photoIndex].caption = caption;
    setPages(updatedPages);
    addToHistory(updatedPages);
  };

  const handleFilterChange = (pageIndex: number, photoIndex: number, filter: string) => {
    const updatedPages = [...pages];
    updatedPages[pageIndex].photos[photoIndex].filter = filter;
    setPages(updatedPages);
    addToHistory(updatedPages);
  };

  const addPage = () => {
    const newPage: PhotoPage = {
      id: generateId(),
      photos: Array.from({ length: newPagePhotoCount }, () => ({ 
        id: generateId(),
        image: undefined, 
        caption: "", 
        text: "",
        isText: false 
      })),
      sectionTitle: "",
      layout: currentLayout,
      photosPerPage: newPagePhotoCount,
      backgroundColor: background.color,
      backgroundOpacity: background.opacity
    };
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    addToHistory(updatedPages);
    setIsAddingPage(false);
  };

  const duplicatePage = (pageIndex: number) => {
    const pageToClone = pages[pageIndex];
    const newPage: PhotoPage = {
      ...JSON.parse(JSON.stringify(pageToClone)),
      id: generateId(),
      photos: pageToClone.photos.map(photo => ({
        ...photo,
        id: generateId()
      }))
    };
    const updatedPages = [...pages.slice(0, pageIndex + 1), newPage, ...pages.slice(pageIndex + 1)];
    setPages(updatedPages);
    addToHistory(updatedPages);
  };

  const deletePage = (pageIndex: number) => {
    const updatedPages = pages.filter((_, index) => index !== pageIndex);
    setPages(updatedPages);
    addToHistory(updatedPages);
  };

  const saveToLocalStorage = () => {
    localStorage.setItem('photobook', JSON.stringify({ pages, title, coverPhoto }));
    toast({
      title: "Changes saved",
      description: "Your photobook has been saved to local storage",
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPages(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPages(history[historyIndex + 1]);
    }
  };

  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    setIsDragging(true);
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    if (draggedPageId && draggedPageId !== pageId) {
      const draggedIndex = pages.findIndex(p => p.id === draggedPageId);
      const hoverIndex = pages.findIndex(p => p.id === pageId);
      const updatedPages = [...pages];
      const [draggedPage] = updatedPages.splice(draggedIndex, 1);
      updatedPages.splice(hoverIndex, 0, draggedPage);
      setPages(updatedPages);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedPageId(null);
    addToHistory(pages);
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

      // Cover Page
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setFontSize(24);
      pdf.text(title || "My PhotoBook", pageWidth / 2, 40, { align: "center" });

      if (coverPhoto) {
        try {
          const dimensions = await getImageDimensions(coverPhoto);
          const aspectRatio = dimensions.width / dimensions.height;
          const maxWidth = pageWidth - 2 * margin;
          const maxHeight = pageHeight - 80;
          let imgWidth = maxWidth;
          let imgHeight = imgWidth / aspectRatio;
          
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * aspectRatio;
          }

          const x = (pageWidth - imgWidth) / 2;
          pdf.addImage(coverPhoto, 'JPEG', x, 60, imgWidth, imgHeight);
        } catch (error) {
          console.error('Error loading cover photo:', error);
        }
      }

      // Content Pages
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        pdf.addPage();

        if (page.sectionTitle) {
          pdf.setFontSize(18);
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
          const row = Math.floor(photoIndex / photosPerRow);
          const col = photoIndex % photosPerRow;
          const x = margin + (col * (photoWidth + 10));
          const y = margin + titleSpace + (row * (photoHeight + 10));

          if (photo.isText && photo.text) {
            pdf.setFontSize(12);
            pdf.text(photo.text, x, y + 10, {
              maxWidth: photoWidth,
              align: 'left'
            });
          } else if (photo.image) {
            try {
              pdf.addImage(photo.image, 'JPEG', x, y, photoWidth, photoHeight);
            } catch (error) {
              console.error(`Error processing photo ${photoIndex}:`, error);
            }
          }

          if (photo.caption) {
            pdf.setFontSize(10);
            pdf.text(photo.caption, x + photoWidth / 2, y + photoHeight + 5, { align: "center" });
          }
        }
      }

      pdf.save(`${title || 'photobook'}.pdf`);
      toast({
        title: "PDF exported successfully",
        description: "Your photobook has been saved as a PDF file",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
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
              className="w-full py-6 text-lg">
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
                  className="w-full p-3 border rounded-lg shadow-sm bg-white text-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Cover Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  {coverPhoto ? (
                    <Image
                      src={coverPhoto}
                      alt="Cover"
                      width={500}
                      height={300}
                      className="max-h-full object-contain rounded-lg"
                    />
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

              {title && coverPhoto && (
                <Dialog>
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
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Continue with the main content JSX
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="p-4 sticky top-4 z-50 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Select value={currentLayout} onValueChange={setCurrentLayout}>
                  <SelectTrigger className="w-40">
                    <Layout className="w-4 h-4 mr-2" />
                    <SelectValue defaultValue="grid">
                      {layouts[currentLayout as keyof typeof layouts]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(layouts).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
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
                          onChange={(e) => setBackground(prev => ({ ...prev, color: e.target.value }))}
                          className="w-full h-8"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Opacity</label>
                        <Slider
                          value={[background.opacity]}
                          max={1}
                          step={0.1}
                          onValueChange={(value) => setBackground(prev => ({ ...prev, opacity: value[0] }))}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="w-10 h-10"
                >
                  <Undo className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="w-10 h-10"
                >
                  <Redo className="w-4 h-4" />
                </Button>

                <Button onClick={saveToLocalStorage} variant="outline" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>

              <Button onClick={exportToPDF} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </Card>

          {/* Pages */}
          {pages.map((page, pageIndex) => (
            <Card
              key={page.id}
              className="p-6"
              draggable
              onDragStart={(e) => handleDragStart(e, page.id)}
              onDragOver={(e) => handleDragOver(e, page.id)}
              onDragEnd={handleDragEnd}
              style={{ opacity: isDragging && draggedPageId === page.id ? 0.5 : 1 }}
            >
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    placeholder="Section Title (optional)"
                    value={page.sectionTitle || ""}
                    onChange={(e) => handleSectionTitleChange(pageIndex, e.target.value)}
                    className="text-xl font-semibold p-2 border rounded flex-grow mr-4 bg-white text-black"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => duplicatePage(pageIndex)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deletePage(pageIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className={`grid ${page.layout === 'carousel' ? '' : layoutClasses[page.layout]}`}>
                  {page.photos.map((photo, photoIndex) => (
                    <div key={photo.id} className="aspect-square">
                      <div className="relative w-full h-full group">
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleContentType(pageIndex, photoIndex)}
                            className="bg-white"
                          >
                            {photo.isText ? <ImageIcon className="w-4 h-4" /> : <Type className="w-4 h-4" />}
                          </Button>
                          
                          {!photo.isText && photo.image && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="bg-white">
                                  <Filter className="w-4 h-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <div className="space-y-2">
                                  {Object.entries(filters).map(([key, value]) => (
                                    <Button
                                      key={key}
                                      variant="outline"
                                      className="w-full justify-start"
                                      onClick={() => handleFilterChange(pageIndex, photoIndex, key)}
                                    >
                                      {value}
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        
                        {photo.isText ? (
                          <textarea
                            value={photo.text || ""}
                            onChange={(e) => handleTextContent(pageIndex, photoIndex, e.target.value)}
                            placeholder="Enter text..."
                            className="w-full h-full p-4 border rounded-lg resize-none bg-white text-black"
                          />
                        ) : (
                          <label
                            className="flex flex-col items-center justify-center w-full h-full border rounded-lg cursor-pointer overflow-hidden"
                            style={{
                              backgroundColor: page.backgroundColor || background.color,
                              opacity: page.backgroundOpacity ?? background.opacity
                            }}
                          >
                            {photo.image ? (
                              <div className="relative w-full h-full group">
                                <Image
                                  src={photo.image}
                                  alt={`Photo ${photoIndex + 1}`}
                                  width={500}
                                  height={500}
                                  className="w-full h-full object-cover transition-transform"
                                  style={{
                                    filter: getFilterStyle(photo.filter),
                                    transform: `rotate(${photo.rotation || 0}deg)`
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="Add caption..."
                                  value={photo.caption || ""}
                                  onChange={(e) => handleCaptionChange(pageIndex, photoIndex, e.target.value)}
                                  className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
                        )}
                      </div>
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