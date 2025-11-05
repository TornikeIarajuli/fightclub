// pages/register.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { X, Plus, UserPlus } from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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
  const [martialArtInput, setMartialArtInput] = useState('');
  const [preferredStyleInput, setPreferredStyleInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  const nextStep = () => {
    if (step === 1) {
      if (!formData.username || !formData.email || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://fightmatch-backend.onrender.com/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          age: parseInt(formData.age),
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          location: formData.location,
          bio: formData.bio,
          martial_arts: formData.martial_arts,
          experience_years: parseInt(formData.experience_years),
          skill_level: formData.skill_level,
          preferred_styles: formData.preferred_styles,
          weight_class: formData.weight_class
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Auto login after registration
        const loginResponse = await fetch('https://fightmatch-backend.onrender.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            username: formData.username,
            password: formData.password
          })
        });

        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
          localStorage.setItem('access_token', loginData.access_token);
          router.push('/discover');
        }
      } else {
        // Handle different error formats
        if (typeof data.detail === 'string') {
          setError(data.detail);
        } else if (Array.isArray(data.detail)) {
          setError(data.detail.map(err => err.msg).join(', '));
        } else {
          setError('Registration failed. Please check your information.');
        }
      }
    } catch (err) {
      setError('Connection error. Make sure the backend is running.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-red-900/20 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🥊</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
            FightMatch
          </h1>
          <p className="text-gray-400">Join the ultimate fighting community</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                  step >= s
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50'
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded transition ${
                    step > s ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gray-800'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <p className="text-gray-400 text-sm">
              {step === 1 && 'Account Details'}
              {step === 2 && 'Personal Information'}
              {step === 3 && 'Fighting Profile'}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-center">
            {error}
          </div>
        )}

        {/* Form Container */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl p-8 border border-red-500/20">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Details */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-6">Create Your Account</h2>

                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    placeholder="Choose a username"
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
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    placeholder="Create a strong password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-6">Personal Details</h2>

                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    placeholder="John Doe"
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
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                      placeholder="25"
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
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                      placeholder="180"
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
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                      placeholder="75"
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
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    placeholder="New York, USA"
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
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition resize-none"
                    placeholder="Tell us about yourself..."
                    required
                  />
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Fighting Profile */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-6">Fighting Profile</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                      Skill Level
                    </label>
                    <select
                      name="skill_level"
                      value={formData.skill_level}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition"
                      required
                    >
                      <option value="">Select level</option>
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
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                      placeholder="5"
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
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition"
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

                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-3">
                    Martial Arts (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                    {[
                      'Boxing', 'Kickboxing', 'MMA', 'Muay Thai', 'Brazilian Jiu-Jitsu',
                      'Wrestling', 'Judo', 'Karate', 'Taekwondo', 'Kung Fu',
                      'Krav Maga', 'Sambo', 'Capoeira', 'Savate', 'Wing Chun',
                      'Aikido', 'Hapkido', 'Jeet Kune Do', 'Kyokushin', 'Sanda'
                    ].map((art) => (
                      <label
                        key={art}
                        className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition ${
                          formData.martial_arts.includes(art)
                            ? 'bg-red-600/30 border-2 border-red-500 text-red-400'
                            : 'bg-gray-900 border-2 border-gray-700 text-gray-300 hover:border-red-500/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.martial_arts.includes(art)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                martial_arts: [...formData.martial_arts, art]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                martial_arts: formData.martial_arts.filter(a => a !== art)
                              });
                            }
                          }}
                          className="hidden"
                        />
                        <span className="font-semibold text-sm">{art}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-3">
                    Preferred Styles (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      'Striking', 'Grappling', 'Ground Fighting', 'Stand-up',
                      'Submission', 'Clinch Work', 'Throws', 'Takedowns'
                    ].map((style) => (
                      <label
                        key={style}
                        className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition ${
                          formData.preferred_styles.includes(style)
                            ? 'bg-gray-700/50 border-2 border-gray-500 text-gray-200'
                            : 'bg-gray-900 border-2 border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.preferred_styles.includes(style)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                preferred_styles: [...formData.preferred_styles, style]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                preferred_styles: formData.preferred_styles.filter(s => s !== style)
                              });
                            }
                          }}
                          className="hidden"
                        />
                        <span className="font-semibold text-sm">{style}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30 flex items-center justify-center space-x-2"
                  >
                    <UserPlus size={20} />
                    <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-red-500 hover:text-red-400 font-semibold"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}