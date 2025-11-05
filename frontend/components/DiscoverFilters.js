// components/DiscoverFilters.js - FIXED VERSION
import { useState, useEffect } from 'react';
import { Filter, X, MapPin, Award, Users, Calendar, Target } from 'lucide-react';

export default function DiscoverFilters({ onApplyFilters, onClose }) {
  const [filters, setFilters] = useState({
    martial_arts: [],
    weight_class: '',
    skill_level: '',
    gender: '',
    max_distance: 50,
    experience_min: 0,
    experience_max: 20,
    day_of_week: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    martial_arts: [],
    weight_classes: [],
    skill_levels: [],
    genders: [],
    days_of_week: []
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('https://fightmatch-backend.onrender.com/filters/options');
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const toggleMartialArt = (art) => {
    setFilters(prev => ({
      ...prev,
      martial_arts: prev.martial_arts.includes(art)
        ? prev.martial_arts.filter(a => a !== art)
        : [...prev.martial_arts, art]
    }));
  };

  const handleApply = () => {
    // Remove empty filters - only send filters that are actually set
    const activeFilters = {};

    // Only add martial_arts if there are selected items
    if (filters.martial_arts.length > 0) {
      activeFilters.martial_arts = filters.martial_arts;
    }

    // Only add string filters if they're not empty
    if (filters.weight_class) {
      activeFilters.weight_class = filters.weight_class;
    }

    if (filters.skill_level) {
      activeFilters.skill_level = filters.skill_level;
    }

    if (filters.gender) {
      activeFilters.gender = filters.gender;
    }

    if (filters.day_of_week) {
      activeFilters.day_of_week = filters.day_of_week;
    }

    // Only add max_distance if it's not the default value (50)
    if (filters.max_distance !== 50) {
      activeFilters.max_distance = filters.max_distance;
    }

    // Only add experience filters if they're not default (0 and 20)
    if (filters.experience_min !== 0) {
      activeFilters.experience_min = filters.experience_min;
    }

    if (filters.experience_max !== 20) {
      activeFilters.experience_max = filters.experience_max;
    }

    onApplyFilters(activeFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      martial_arts: [],
      weight_class: '',
      skill_level: '',
      gender: '',
      max_distance: 50,
      experience_min: 0,
      experience_max: 20,
      day_of_week: ''
    };

    setFilters(resetFilters);

    // Also apply the reset immediately
    onApplyFilters({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-4xl w-full border-2 border-red-500/30 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800/95 backdrop-blur z-10 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Filter className="text-red-500" />
            Advanced Filters
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filters Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Martial Arts */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Target size={16} className="text-red-500" />
              Martial Arts Styles
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.martial_arts.map((art) => (
                <button
                  key={art}
                  onClick={() => toggleMartialArt(art)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filters.martial_arts.includes(art)
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {art}
                </button>
              ))}
            </div>
          </div>

          {/* Grid for other filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weight Class */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <Award size={16} className="text-red-500" />
                Weight Class
              </label>
              <select
                value={filters.weight_class}
                onChange={(e) => setFilters({ ...filters, weight_class: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              >
                <option value="">Any Weight Class</option>
                {filterOptions.weight_classes.map((wc) => (
                  <option key={wc} value={wc}>{wc}</option>
                ))}
              </select>
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <Award size={16} className="text-red-500" />
                Skill Level
              </label>
              <select
                value={filters.skill_level}
                onChange={(e) => setFilters({ ...filters, skill_level: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              >
                <option value="">Any Skill Level</option>
                {filterOptions.skill_levels.map((sl) => (
                  <option key={sl} value={sl}>{sl}</option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <Users size={16} className="text-red-500" />
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              >
                <option value="">Any Gender</option>
                {filterOptions.genders.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Day of Week (Availability) */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-red-500" />
                Available On
              </label>
              <select
                value={filters.day_of_week}
                onChange={(e) => setFilters({ ...filters, day_of_week: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              >
                <option value="">Any Day</option>
                {filterOptions.days_of_week.map((day) => (
                  <option key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Distance Slider */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-red-500" />
              Max Distance: {filters.max_distance} km
            </label>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={filters.max_distance}
              onChange={(e) => setFilters({ ...filters, max_distance: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>

          {/* Experience Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Experience Years: {filters.experience_min} - {filters.experience_max} years
            </label>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400">Minimum</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.experience_min}
                  onChange={(e) => setFilters({
                    ...filters,
                    experience_min: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Maximum</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.experience_max}
                  onChange={(e) => setFilters({
                    ...filters,
                    experience_max: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 p-6 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={handleReset}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
          >
            Reset Filters
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition shadow-lg shadow-red-500/30"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}