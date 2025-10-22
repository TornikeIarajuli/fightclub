// pages/settings.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';
import { MapPin, Calendar, Save, Plus, X } from 'lucide-react';

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({
    latitude: '',
    longitude: ''
  });
  const [availability, setAvailability] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [newTimeSlot, setNewTimeSlot] = useState({
    day: '',
    start: '',
    end: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, []);

  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          });
          setLoading(false);
        },
        (error) => {
          alert('Unable to get location. Please enter manually.');
          setLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  };

  const saveLocation = async () => {
    if (!location.latitude || !location.longitude) {
      alert('Please enter valid coordinates');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/users/me/location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude)
        })
      });

      if (response.ok) {
        alert('Location saved successfully!');
      } else {
        alert('Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location');
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = () => {
    if (!newTimeSlot.day || !newTimeSlot.start || !newTimeSlot.end) {
      alert('Please fill in all fields');
      return;
    }

    const timeSlot = `${newTimeSlot.start}-${newTimeSlot.end}`;
    setAvailability(prev => ({
      ...prev,
      [newTimeSlot.day]: [...prev[newTimeSlot.day], timeSlot]
    }));

    setNewTimeSlot({ day: '', start: '', end: '' });
  };

  const removeTimeSlot = (day, index) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const saveAvailability = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/users/me/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          availability: availability
        })
      });

      if (response.ok) {
        alert('Availability saved successfully!');
      } else {
        alert('Failed to save availability');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Error saving availability');
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>

        {/* Location Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-red-500/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MapPin className="text-red-500" />
            Location Settings
          </h2>

          <p className="text-gray-400 mb-4">
            Set your location to find fighters nearby using distance filters
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={location.latitude}
                onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                placeholder="41.7151"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={location.longitude}
                onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                placeholder="44.8271"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={getUserLocation}
              disabled={loading}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold rounded-lg transition"
            >
              {loading ? 'Getting Location...' : 'Use Current Location'}
            </button>
            <button
              onClick={saveLocation}
              disabled={loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 text-white font-semibold rounded-lg transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Location
            </button>
          </div>
        </div>

        {/* Availability Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-red-500/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="text-red-500" />
            Availability Schedule
          </h2>

          <p className="text-gray-400 mb-6">
            Set your available training times so others can find you when you're free
          </p>

          {/* Add Time Slot */}
          <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
            <h3 className="text-white font-semibold mb-4">Add Time Slot</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={newTimeSlot.day}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, day: e.target.value })}
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              >
                <option value="">Select Day</option>
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </option>
                ))}
              </select>

              <input
                type="time"
                value={newTimeSlot.start}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, start: e.target.value })}
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              />

              <input
                type="time"
                value={newTimeSlot.end}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, end: e.target.value })}
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              />

              <button
                onClick={addTimeSlot}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>

          {/* Display Schedule */}
          <div className="space-y-4 mb-6">
            {daysOfWeek.map(day => (
              <div key={day} className="bg-gray-900/50 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-2 capitalize">{day}</h4>
                {availability[day].length === 0 ? (
                  <p className="text-gray-500 text-sm">No availability set</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availability[day].map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold border border-red-500/30"
                      >
                        <span>{slot}</span>
                        <button
                          onClick={() => removeTimeSlot(day, index)}
                          className="hover:text-red-300 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={saveAvailability}
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 text-white font-semibold rounded-lg transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
}