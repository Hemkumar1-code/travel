import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTracking } from '../hooks/useTracking';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Navigation, StopCircle, PlayCircle, MapPin, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FieldUser() {
  const { currentUser, logout } = useAuth();
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const { isTracking, startTracking, stopTracking, currentLocation, tripData, error } = useTracking(currentUser?.uid, userName);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if(isTracking) {
      await stopTracking();
    }
    await logout();
    navigate('/login');
  };

  const handleWhatsAppShare = () => {
    if (!tripData) return;
    const text = `Trip completed by ${userName}.\nDistance: ${tripData.distanceKm} km\nDuration: ${tripData.durationSeconds}s.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden p-6 max-w-md mx-auto">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{
            scale: isTracking ? [1, 1.2, 1] : 1,
            opacity: isTracking ? 0.4 : 0.1,
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"
        />
        <motion.div 
          animate={{
            scale: isTracking ? [1, 1.3, 1] : 1,
            opacity: isTracking ? 0.3 : 0.1,
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className={`absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 ${isTracking ? 'bg-success/30' : 'bg-primary/20'}`}
        />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center mb-12 relative z-10 pt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Hi, {userName}</h1>
          <p className="text-white/60 font-medium">Ready for your trip?</p>
        </div>
        <button 
          onClick={handleLogout}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
        >
          <LogOut className="w-5 h-5 text-white/80" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 relative">
        <div className="glass-card w-full p-8 flex flex-col items-center justify-center mb-8 relative overflow-hidden">
          {/* Status Indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 text-sm font-medium">
            <motion.div 
              animate={{ opacity: isTracking ? [1, 0.4, 1] : 1 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`w-2.5 h-2.5 rounded-full ${isTracking ? 'bg-success' : 'bg-white/30'}`}
            />
            {isTracking ? 'Active' : 'Offline'}
          </div>

          <motion.div 
            className="mt-12 mb-8 relative"
            animate={isTracking ? { y: [0, -10, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className={`p-6 rounded-full border-2 ${isTracking ? 'border-success/50 bg-success/10' : 'border-white/10 bg-white/5'}`}>
              <Navigation className={`w-16 h-16 ${isTracking ? 'text-success drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'text-white/50'}`} />
            </div>
            
            {/* Ripple effect when tracking */}
            <AnimatePresence>
              {isTracking && (
                <motion.div
                  initial={{ opacity: 0.8, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-success"
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* Location Info */}
          <div className="h-16 flex items-center justify-center w-full">
            {isTracking && currentLocation ? (
              <div className="flex items-center gap-2 text-white/80 bg-black/30 px-4 py-2 rounded-xl">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-mono text-sm tracking-widest">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-danger-400 bg-danger/10 px-4 py-2 rounded-xl border border-danger/20 text-sm">
                 <ShieldAlert className="w-4 h-4" />
                 {error}
              </div>
            ) : (
              <div className="text-white/40 text-sm px-4 py-2">
                Press Start to capture location
              </div>
            )}
          </div>
        </div>

        {/* Big Action Buttons */}
        <div className="w-full space-y-4">
          <AnimatePresence mode="wait">
            {!isTracking ? (
              <motion.button
                key="start"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.95 }}
                onClick={startTracking}
                className="w-full relative overflow-hidden group bg-success hover:bg-success/90 text-white font-bold text-lg py-5 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-3"
              >
                <PlayCircle className="w-6 h-6" />
                START TRACKING
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </motion.button>
            ) : (
              <motion.button
                key="stop"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopTracking}
                className="w-full relative overflow-hidden group bg-danger hover:bg-danger/90 text-white font-bold text-lg py-5 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center gap-3"
              >
                <StopCircle className="w-6 h-6" />
                STOP TRACKING
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Trip Summary Modal/Card */}
        <AnimatePresence>
          {tripData && !isTracking && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-x-0 bottom-0 p-6 glass-card border-b-0 rounded-b-none z-20"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-primary" />
                Trip Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Distance</p>
                  <p className="text-2xl font-semibold">{tripData.distanceKm} <span className="text-base text-white/50 font-normal">km</span></p>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Time</p>
                  <p className="text-2xl font-semibold">{(tripData.durationSeconds / 60).toFixed(1)} <span className="text-base text-white/50 font-normal">m</span></p>
                </div>
              </div>
              <button 
                onClick={handleWhatsAppShare}
                className="w-full bg-[#25D366] hover:bg-[#20b858] text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                Share Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
