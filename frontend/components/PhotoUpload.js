// components/PhotoUpload.js
import { useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';

export default function PhotoUpload({ currentPhotoUrl, onPhotoUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPhotoUrl);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://fightmatch-backend.onrender.com/users/me/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert('Photo uploaded successfully!');
        onPhotoUpdated(data.photo_url);
      } else {
        alert('Failed to upload photo');
        setPreview(currentPhotoUrl);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo');
      setPreview(currentPhotoUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete your profile photo?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/users/me/photo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Photo deleted successfully!');
        setPreview(null);
        onPhotoUpdated(null);
      } else {
        alert('Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Error deleting photo');
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Photo Display */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
          {preview ? (
            <img
              src={preview.startsWith('http') ? preview : `https://fightmatch-backend.onrender.com${preview}`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="text-white" size={48} />
          )}
        </div>

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <label
            htmlFor="photo-upload"
            className="cursor-pointer p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
          >
            <Upload className="text-white" size={24} />
          </label>
          {preview && (
            <button
              onClick={handleDeletePhoto}
              className="ml-2 p-3 bg-red-600 hover:bg-red-700 rounded-full transition"
            >
              <X className="text-white" size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        id="photo-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload button (visible when no photo) */}
      {!preview && (
        <label
          htmlFor="photo-upload"
          className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition cursor-pointer flex items-center gap-2"
        >
          <Camera size={20} />
          Upload Photo
        </label>
      )}

      {uploading && (
        <div className="mt-4 text-gray-400 text-sm">Uploading...</div>
      )}

      <p className="text-gray-500 text-xs mt-2 text-center">
        Max 5MB • JPEG, PNG, GIF, WebP
      </p>
    </div>
  );
}