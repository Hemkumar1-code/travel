import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, set, remove, push } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Users, UserPlus, FileText, Settings, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapComponent from '../components/MapComponent';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [waNumbers, setWaNumbers] = useState([]);
  const [newWaNumber, setNewWaNumber] = useState('');

  useEffect(() => {
    // Listen to active tracking data
    const trackingRef = ref(db, 'tracking');
    const unsubTracking = onValue(trackingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setTrackingUsers(arr);
      } else {
        setTrackingUsers([]);
      }
    });

    // Listen to completed trips
    const tripsRef = ref(db, 'trips');
    const unsubTrips = onValue(tripsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();
        setTrips(arr);
      } else {
        setTrips([]);
      }
    });

    // Listen to settings
    const settingsRef = ref(db, 'settings');
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.whatsappNumbers) {
        setWaNumbers(Object.values(data.whatsappNumbers));
      } else {
        setWaNumbers([]);
      }
    });

    return () => {
      unsubTracking();
      unsubTrips();
      unsubSettings();
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    // In a real app, you'd use a cloud function to create the user in Firebase Auth.
    // Here we'll just simulate it by adding to the tracking list as 'inactive'
    const userRef = ref(db, `users/${Date.now()}`); // Mocking UID
    await set(userRef, {
      name: newUser.name,
      role: 'field',
      email: newUser.email
    });
    setIsAddUserOpen(false);
    setNewUser({ name: '', email: '', password: '' });
  };

  const handleAddWaNumber = async () => {
    if (!newWaNumber) return;
    const newRef = push(ref(db, 'settings/whatsappNumbers'));
    await set(newRef, newWaNumber);
    setNewWaNumber('');
  };

  return (
    <div className="flex w-full h-full bg-background overflow-hidden relative">
      {/* Sidebar */}
      <aside className="w-80 h-full border-r border-white/10 bg-black/50 backdrop-blur-3xl flex flex-col z-10 shadow-2xl relative">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white mb-1">Geofleet</h1>
            <p className="text-xs text-white/50 tracking-widest uppercase">Admin Portal</p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
            <LogOut className="w-4 h-4 text-white/70" />
          </button>
        </div>

        <nav className="p-4 space-y-2 border-b border-white/10 overflow-x-auto flex flex-col">
          <button 
            onClick={() => setActiveTab('tracking')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab==='tracking' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Live Tracking</span>
          </button>
          <button 
            onClick={() => setActiveTab('trips')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab==='trips' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Trip History</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab==='settings' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {activeTab === 'tracking' && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-center mb-2 px-2">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Active Monitor</h3>
                  <button onClick={() => setIsAddUserOpen(true)} className="p-1 hover:bg-white/10 rounded-full text-primary">
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
                {trackingUsers.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-6">No users active currently.</p>
                ) : trackingUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedUser?.id === user.id ? 'border-primary/50 bg-black/60 shadow-lg shadow-black/50' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="font-bold text-white text-sm">{user.name || 'Unknown User'}</h4>
                       <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white/20'}`} />
                    </div>
                    {user.status === 'active' ? (
                       <p className="text-xs text-white/50 flex items-center gap-1">
                         Status: <span className="text-success font-medium">Tracking</span>
                       </p>
                    ) : (
                       <p className="text-xs text-white/40">Status: Offline</p>
                    )}
                  </button>
                ))}
              </motion.div>
            )}

            {activeTab === 'trips' && (
              <motion.div
                key="trips"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-2">Recent Trips</h3>
                {trips.length === 0 ? (
                   <p className="text-xs text-white/30 text-center py-6">No trips recorded yet.</p>
                ) : trips.map(trip => (
                  <div key={trip.id} className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white text-sm">{trip.userName || 'User'}</h4>
                      <span className="text-[10px] text-white/40 uppercase bg-black/40 px-2 py-1 rounded-sm border border-white/5">
                        {new Date(trip.endTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                       <span className="bg-black/40 p-1.5 rounded-lg border border-white/5 text-center">
                         <strong className="text-white block text-sm">{trip.distanceKm}</strong> km
                       </span>
                       <span className="bg-black/40 p-1.5 rounded-lg border border-white/5 text-center">
                         <strong className="text-white block text-sm">{(trip.durationSeconds/60).toFixed(0)}</strong> min
                       </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-2">Notifications</h3>
                <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 px-1 italic">WhatsApp Alert Numbers</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newWaNumber}
                        onChange={e => setNewWaNumber(e.target.value)}
                        placeholder="+91..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                      <button onClick={handleAddWaNumber} className="bg-primary p-2 rounded-lg hover:bg-primary/80">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {waNumbers.map((num, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5 text-xs">
                        <span>{num}</span>
                        <button className="text-danger/60 hover:text-danger">
                          <Trash2 className="w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="flex-1 relative bg-[#0a0a0a]">
        <MapComponent activeUsers={trackingUsers} selectedUser={selectedUser} />
        
        {/* UI overlay */}
        <div className="absolute top-6 right-6 z-10 glass-card px-4 py-2 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium text-white/80">
            {trackingUsers.filter(u => u.status === 'active').length} Users Online
          </span>
        </div>

        {/* Add User Modal */}
        <AnimatePresence>
          {isAddUserOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card w-full max-w-md p-6 relative"
              >
                <button 
                  onClick={() => setIsAddUserOpen(false)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <UserPlus className="text-primary" /> Add New Field User
                </h2>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-white/50 ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" 
                      placeholder="John Doe"
                      value={newUser.name}
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/50 ml-1">Email</label>
                    <input 
                      required
                      type="email" 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" 
                      placeholder="john@geofleet.com"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/50 ml-1">Password</label>
                    <input 
                      required
                      type="password" 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" 
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full bg-primary hover:bg-primary/90 py-3 rounded-xl font-bold mt-4 shadow-lg shadow-primary/20">
                    CREATE ACCOUNT
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
