// pages/index.js
import { useRouter } from 'next/router';
import { Swords } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-4xl">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-2xl shadow-2xl shadow-red-500/50 animate-float">
            <Swords className="w-20 h-20 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-7xl font-black mb-4 bg-gradient-to-r from-white via-red-200 to-white bg-clip-text text-transparent drop-shadow-2xl">
          Fight Match
        </h1>

        {/* Tagline */}
        <p className="text-2xl text-gray-300 mb-12 font-light tracking-wide">
          Find your next sparring partner
        </p>

        {/* Buttons */}
        <div className="flex gap-6 justify-center flex-wrap">
          <button
            onClick={() => router.push('/login')}
            className="group relative px-12 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/50 hover:shadow-red-500/80"
          >
            <span className="relative z-10">Login</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <button
            onClick={() => router.push('/register')}
            className="group relative px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/50 hover:shadow-blue-500/80"
          >
            <span className="relative z-10">Register</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6 hover:border-red-500/50 transition-all duration-300">
            <div className="text-4xl mb-4">🥊</div>
            <h3 className="text-xl font-bold text-white mb-2">Match Fighters</h3>
            <p className="text-gray-400">Connect with martial artists in your area</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6 hover:border-red-500/50 transition-all duration-300">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Track Stats</h3>
            <p className="text-gray-400">Keep your fight record and improve</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6 hover:border-red-500/50 transition-all duration-300">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-white mb-2">Chat & Plan</h3>
            <p className="text-gray-400">Message matches and schedule sessions</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}