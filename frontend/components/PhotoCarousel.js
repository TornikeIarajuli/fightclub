// components/PhotoCarousel.js
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PhotoCarousel({ userId, photos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-80 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-2">📷</div>
          <p className="text-gray-500 text-sm">No photos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 overflow-hidden group">
      {/* Main Image */}
      <img
        src={photos[currentIndex].photo_url.startsWith('http')
          ? photos[currentIndex].photo_url
          : `https://fightmatch-backend.onrender.com${photos[currentIndex].photo_url}`}
        alt="Profile"
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-900 to-transparent"></div>

      {/* Navigation buttons (only show if multiple photos) */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prevPhoto}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={nextPhoto}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronRight size={24} />
          </button>

          {/* Photo indicators */}
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 px-4">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 w-1 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          {/* Photo counter */}
          <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm font-semibold">
            {currentIndex + 1}/{photos.length}
          </div>
        </>
      )}
    </div>
  );
}