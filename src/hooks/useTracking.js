import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { ref, set, push, update, onDisconnect } from 'firebase/database';
import { Geolocation } from '@capacitor/geolocation';

function calculateDistance(lat1, lon1, lat2, lon2) {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p) / 2 +
    c(lat1 * p) * c(lat2 * p) *
    (1 - c((lon2 - lon1) * p)) / 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

export function useTracking(userId, userName) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [path, setPath] = useState([]);
  const [tripData, setTripData] = useState(null);
  const [error, setError] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const trackingRef = ref(db, `tracking/${userId}`);
    const onDisconnectRef = onDisconnect(trackingRef);
    onDisconnectRef.update({ status: 'offline', lastSeen: Date.now() });

    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
      onDisconnectRef.cancel();
    };
  }, [userId]);

  const startTracking = async () => {
    if (!userId) {
      setError('User identity not found. Log in again.');
      return;
    }

    try {
      setError(null);
      setSyncError(null);
      const checkResult = await Geolocation.checkPermissions();

      if (checkResult.location !== 'granted') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location !== 'granted') {
          setError('Location permission denied. Set to "Allow all the time".');
          return;
        }
      }

      setIsTracking(true);
      setPath([]);
      setTripData(null);
      startTimeRef.current = Date.now();

      // Ensure the user exists in Firebase
      try {
        await set(ref(db, `tracking/${userId}`), {
          status: 'active',
          name: userName || 'Unknown User',
          startTime: startTimeRef.current,
          lastSeen: Date.now()
        });
      } catch (e) {
        console.error("Firebase connection failed", e);
        setSyncError("Cannot connect to Admin. Check DB Rules.");
      }

      const handleNewLocation = (position) => {
        if (!position) return;
        const { latitude, longitude } = position.coords;
        const pt = { lat: latitude, lng: longitude, timestamp: Date.now() };

        setCurrentLocation(prev => {
          if (!prev || pt.timestamp > prev.timestamp) return pt;
          return prev;
        });

        // Sync to Firebase
        update(ref(db, `tracking/${userId}`), {
          currentLocation: pt,
          lastSeen: Date.now(),
          status: 'active'
        }).catch((e) => {
            console.error("Sync error:", e);
            setSyncError("Cloud Sync Failed");
        });

        setPath(prev => {
          if (prev.length > 0) {
             const last = prev[prev.length - 1];
             if (last.lat === pt.lat && last.lng === pt.lng) return prev;
          }
          const newPath = [...prev, pt];
          update(ref(db, `tracking/${userId}`), { path: newPath }).catch(() => {});
          return newPath;
        });
      };

      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 },
        (position, err) => {
          if (err) {
            if (err.code !== 3) setError(`GPS Failed: ${err.message}`);
            return;
          }
          if (position) {
             setError(null);
             handleNewLocation(position);
          }
        }
      );
      watchIdRef.current = watchId;

      const getQuickFix = async () => {
        try {
          const highPos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
          if (highPos) handleNewLocation(highPos);
        } catch (e) {
          try {
            const lowPos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 4000 });
            if (lowPos) handleNewLocation(lowPos);
          } catch (e2) {}
        }
      };
      getQuickFix();

    } catch (err) {
      setError(err.message || 'Critical error');
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    setIsTracking(false);

    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
      totalDistance += calculateDistance(path[i - 1].lat, path[i - 1].lng, path[i].lat, path[i].lng);
    }
    const endTime = Date.now();
    const summary = {
      userId,
      userName: userName || 'User',
      path,
      distanceKm: totalDistance.toFixed(2),
      durationSeconds: Math.floor((endTime - startTimeRef.current) / 1000),
      startTime: startTimeRef.current,
      endTime
    };
    setTripData(summary);
    try {
      if (path.length > 0) await push(ref(db, `trips`), summary);
      await update(ref(db, `tracking/${userId}`), { status: 'offline', lastSeen: Date.now() });
    } catch (err) {}
    return summary;
  };

  return { isTracking, startTracking, stopTracking, currentLocation, path, tripData, error, syncError };
}
