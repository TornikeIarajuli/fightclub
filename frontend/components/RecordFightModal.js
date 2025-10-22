// components/RecordFightModal.js
import { useState } from 'react';
import { X, Trophy, Users, Target } from 'lucide-react';

export default function RecordFightModal({ isOpen, onClose, matches, onFightRecorded }) {
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [result, setResult] = useState('win');
  const [martialArtStyle, setMartialArtStyle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const martialArts = [
    'BJJ', 'Muay Thai', 'Boxing', 'Wrestling', 'Judo',
    'Karate', 'Taekwondo', 'Kickboxing', 'MMA', 'Sambo'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOpponent || !martialArtStyle) {
      alert('Please select an opponent and martial art style');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/fights/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          opponent_id: parseInt(selectedOpponent),
          result: result,
          martial_art_style: martialArtStyle,
          notes: notes || null
        })
      });

      if (response.ok) {
        alert('Fight recorded successfully!');
        setSelectedOpponent('');
        setResult('win');
        setMartialArtStyle('');
        setNotes('');
        onClose();
        if (onFightRecorded) onFightRecorded();
      } else {
        alert('Failed to record fight');
      }
    } catch (error) {
      console.error('Error recording fight:', error);
      alert('Error recording fight');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-lg w-full border-2 border-red-500/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-red-500" />
            Record Fight
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Select Opponent */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Users size={16} className="text-red-500" />
              Select Opponent
            </label>
            <select
              value={selectedOpponent}
              onChange={(e) => setSelectedOpponent(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              required
            >
              <option value="">Choose an opponent...</option>
              {matches && matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.username}
                </option>
              ))}
            </select>
          </div>

          {/* Result */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Trophy size={16} className="text-red-500" />
              Result
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setResult('win')}
                className={`py-3 rounded-lg font-semibold transition-all ${
                  result === 'win'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Win
              </button>
              <button
                type="button"
                onClick={() => setResult('loss')}
                className={`py-3 rounded-lg font-semibold transition-all ${
                  result === 'loss'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Loss
              </button>
              <button
                type="button"
                onClick={() => setResult('draw')}
                className={`py-3 rounded-lg font-semibold transition-all ${
                  result === 'draw'
                    ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/50'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Draw
              </button>
            </div>
          </div>

          {/* Martial Art Style */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Target size={16} className="text-red-500" />
              Martial Art Style
            </label>
            <select
              value={martialArtStyle}
              onChange={(e) => setMartialArtStyle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              required
            >
              <option value="">Choose style...</option>
              {martialArts.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this fight..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/50"
          >
            {loading ? 'Recording...' : 'Record Fight'}
          </button>
        </form>
      </div>
    </div>
  );
}