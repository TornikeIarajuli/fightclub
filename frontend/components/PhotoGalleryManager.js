// components/PhotoGalleryManager.js
import { useState, useEffect } from 'react';
import { Plus, X, Star, Upload } from 'lucide-react';

export default function PhotoGalleryManager({ userId, isOwner = false }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, [userId]);

  const fetchGallery = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = isOwner
        ? 'http://localhost:8000/users/me/gallery'
        : `http://localhost:8000/users/${userId}/gallery`;

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    }
  };

  const handleUpload = async (e, isPrimary = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (photos.length >= 6) {
      alert('Maximum 6 photos allowed');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/users/me/gallery?is_primary=${isPrimary}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        await fetchGallery();
        alert('Photo uploaded successfully!');
      } else {
        alert('Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/users/me/gallery/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchGallery();
        alert('Photo deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleSetPrimary = async (photoId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/users/me/gallery/${photoId}/primary`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchGallery();
        alert('Primary photo updated!');
      }
    } catch (error) {
      console.error('Error setting primary:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Photo Gallery</h3>
        {isOwner && (
          <span className="text-gray-400 text-sm">{photos.length}/6 photos</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Existing photos */}
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-xl overflow-hidden group bg-gray-800"
          >
            <img
              src={photo.photo_url.startsWith('http')
                ? photo.photo_url
                : `http://localhost:8000${photo.photo_url}`}
              alt="Gallery"
              className="w-full h-full object-cover"
            />

            {/* Primary badge */}
            {photo.is_primary && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-gray-900 px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold">
                <Star size={12} fill="currentColor" />
                Primary
              </div>
            )}

            {/* Owner controls */}
            {isOwner && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(photo.id)}
                    className="p-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg transition"
                    title="Set as primary"
                  >
                    <Star size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  title="Delete"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Upload button (only for owner) */}
        {isOwner && photos.length < 6 && (
          <label
            htmlFor="gallery-upload"
            className={`aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-red-500 flex flex-col items-center justify-center cursor-pointer transition bg-gray-800/50 hover:bg-gray-800 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
            ) : (
              <>
                <Plus className="text-gray-500 mb-2" size={32} />
                <span className="text-gray-500 text-sm font-semibold">Add Photo</span>
              </>
            )}
            <input
              id="gallery-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {isOwner && photos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Upload size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No photos yet. Upload your first photo!</p>
          <p className="text-xs mt-1">You can upload up to 6 photos</p>
        </div>
      )}
    </div>
  );
}