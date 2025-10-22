import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import { Save, X } from 'lucide-react';

export default function EditProfile() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    age: '',
    height: '',
    weight: '',
    location: '',
    bio: '',
    martial_arts: [],
    experience_years: '',
    skill_level: '',
    preferred_styles: [],
    weight_class: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [martialArtInput, setMartialArtInput] = useState('');
  const [preferredStyleInput, setPreferredStyleInput] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      const data = await response.json();
      setFormData({
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        age: data.age,
        height: data.height,
        weight: data.weight,
        location: data.location,
        bio: data.bio,
        martial_arts: data.martial_arts || [],
        experience_years: data.experience_years,
        skill_level: data.skill_level,
        preferred_styles: data.preferred_styles || [],
        weight_class: data.weight_class
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addMartialArt = (e) => {
    e.preventDefault();
    if (martialArtInput.trim() && !formData.martial_arts.includes(martialArtInput.trim())) {
      setFormData({
        ...formData,
        martial_arts: [...formData.martial_arts, martialArtInput.trim()]
      });
      setMartialArtInput('');
    }
  };

  const removeMartialArt = (artToRemove) => {
    setFormData({
      ...formData,
      martial_arts: formData.martial_arts.filter(art => art !== artToRemove)
    });
  };

  const addPreferredStyle = (e) => {
    e.preventDefault();
    if (preferredStyleInput.trim() && !formData.preferred_styles.includes(preferredStyleInput.trim())) {
      setFormData({
        ...formData,
        preferred_styles: [...formData.preferred_styles, preferredStyleInput.trim()]
      });
      setPreferredStyleInput('');
    }
  };

  const removePreferredStyle = (styleToRemove) => {
    setFormData({
      ...formData,
      preferred_styles: formData.preferred_styles.filter(style => style !== styleToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('http://localhost:8000/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          experience_years: parseInt(formData.experience_years)
        })
      });

      if (response.ok) {
        router.push('/profile');
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update profile');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="text-center py-16 text-gray-400 text-xl">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
          <button
            onClick={() => router.push('/profile')}
            className="text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-8 border border-red-500/20 space-y-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Personal Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          {/* Fighting Info */}
          <div className="space-y-4 border-t border-gray-700 pt-6">
            <h3 className="text-xl font-bold text-white">Fighting Profile</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Skill Level
                </label>
                <select
                  name="skill_level"
                  value={formData.skill_level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="">Select skill level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Experience (years)
                </label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Weight Class
              </label>
              <select
                name="weight_class"
                value={formData.weight_class}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                required
              >
                <option value="">Select weight class</option>
                <option value="Flyweight">Flyweight</option>
                <option value="Bantamweight">Bantamweight</option>
                <option value="Featherweight">Featherweight</option>
                <option value="Lightweight">Lightweight</option>
                <option value="Welterweight">Welterweight</option>
                <option value="Middleweight">Middleweight</option>
                <option value="Light Heavyweight">Light Heavyweight</option>
                <option value="Heavyweight">Heavyweight</option>
              </select>
            </div>

            {/* Martial Arts */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Martial Arts
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={martialArtInput}
                  onChange={(e) => setMartialArtInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMartialArt(e)}
                  placeholder="Add martial art..."
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={addMartialArt}
                  type="button"
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.martial_arts.map((art, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-red-600 text-white rounded-full flex items-center space-x-2"
                  >
                    <span>{art}</span>
                    <button
                      type="button"
                      onClick={() => removeMartialArt(art)}
                      className="hover:text-red-200"
                    >
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Styles */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Preferred Styles
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={preferredStyleInput}
                  onChange={(e) => setPreferredStyleInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPreferredStyle(e)}
                  placeholder="Add preferred style..."
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={addPreferredStyle}
                  type="button"
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.preferred_styles.map((style, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-700 text-white rounded-full flex items-center space-x-2"
                  >
                    <span>{style}</span>
                    <button
                      type="button"
                      onClick={() => removePreferredStyle(style)}
                      className="hover:text-gray-300"
                    >
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded-lg transition font-semibold"
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}