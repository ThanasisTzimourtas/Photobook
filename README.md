# Photobook

Photobook is a dynamic, responsive photo gallery application that elegantly displays images in a clean, modern interface. It is designed to be easily integrated with various image sources and optimized for performance through techniques like lazy loading and asynchronous data fetching.

## Overview

### Photobook provides:

A Responsive User Interface: Adapts seamlessly across desktops, tablets, and mobile devices.
Dynamic Image Loading: Loads images asynchronously to maintain a fluid user experience.
Lazy Loading: Uses modern browser APIs to load images only when they enter the viewport.
Modular Architecture: Clean separation between core functionality and UI components, making the project easy to extend and maintain.
Features

Asynchronous Data Fetching: Retrieve image data from an API or a local source without blocking the UI.
Dynamic Gallery Rendering: Automatically builds the gallery layout by injecting image elements into the DOM.
Lazy Loading: Improves performance by deferring the loading of offscreen images.
Lightbox Integration: Enables users to view images in full-screen mode with smooth transitions.
Responsive Design: Uses CSS media queries and flexible grid layouts to adjust to any screen size.
Installation

Prerequisites
Node.js (version 12.x or later)
npm or yarn
Git
Steps
#### 1. Clone the repository:
```bash
git clone https://github.com/ThanasisTzimourtas/Photobook.git
```
#### 2. Navigate to the project directory:
```bash
cd Photobook
```
#### 3. Install the dependencies:
```bash
npm install
# or, if using yarn:
yarn install
```
#### 4. Start the development server:
```bash
npm start
# or:
yarn start
```
5. Open your browser and visit http://localhost:3000 to see the Photobook in action.

## Usage

Once running, Photobook automatically fetches image data (from an API endpoint or a local source) and renders them in a gallery. You can customize the image source, update the gallery layout, or integrate additional features like image filtering and categorization.

## Core Mechanism

### Asynchronous Image Loading and Gallery Rendering
At the core of Photobook is the ability to load images dynamically. The following snippet illustrates how the application fetches image data asynchronously and builds the gallery by creating and appending image elements to the DOM:
```bash
// initializeGallery.js
function initializeGallery() {
  const galleryElement = document.getElementById("gallery");

  // Fetch images from a specified API endpoint or local JSON file
  fetch("/api/images")
    .then(response => response.json())
    .then(data => {
      data.forEach(image => {
        const imgElement = document.createElement("img");
        // The actual URL for lazy loading is stored in data-src
        imgElement.dataset.src = image.url;
        imgElement.alt = image.title;
        imgElement.classList.add("gallery-image", "lazy");
        galleryElement.appendChild(imgElement);
      });
      // Once images are added, initiate lazy loading
      initializeLazyLoading();
    })
    .catch(error => console.error("Error loading images:", error));
}

document.addEventListener("DOMContentLoaded", initializeGallery);
```
### Key Points:

Asynchronous Fetch: The fetch API retrieves image data without blocking the UI.
Dynamic DOM Manipulation: New <img> elements are created and added to the gallery container.
Data Attributes for Lazy Loading: Instead of loading images immediately, the URL is stored in a data-src attribute.

### Lazy Loading Implementation
Lazy loading ensures that images are only loaded when they are about to enter the viewport, saving bandwidth and improving initial page load times. The code below uses the Intersection Observer API:
```bash
// lazyLoad.js
function initializeLazyLoading() {
  const lazyImages = document.querySelectorAll("img.lazy");

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        // Replace placeholder with the actual image URL
        img.src = img.dataset.src;
        img.classList.remove("lazy");
        observer.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => {
    imageObserver.observe(img);
  });
}
```
#### Explanation:

Intersection Observer API: Monitors when each image element becomes visible in the viewport.
Data Attribute Usage: The actual image URL is stored in data-src and only assigned to src when needed.
Performance Optimization: After an image is loaded, it is removed from the observer, ensuring efficient resource usage.

## Project Structure
```bash
Photobook/
├── public/
│   └── index.html          # Main HTML file
├── src/
│   ├── components/         # Reusable UI components (e.g., Header, Footer, Gallery)
│   ├── assets/             # Images, stylesheets, and other static resources
│   ├── utils/              # Utility functions (e.g., initializeGallery.js, lazyLoad.js)
│   ├── App.js              # Main application component
│   └── index.js            # Application entry point
├── package.json            # Project configuration and dependencies
└── README.md               # Project documentation
```

