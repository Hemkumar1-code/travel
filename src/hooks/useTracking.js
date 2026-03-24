import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { ref, set, push, update, onDisconnect } from 'firebase/database';

function calculateDistance(lat1, lon1, lat2, lon2) {
  const p = 0.017453292519943295;    // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

export function useTracking(userId, userName) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [path, setPath] = useState([]);
  const [tripData, setTripData] = useState(null);
  const [error, setError] = useState(null);
  
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Set up disconnect hook so admin knows when user drops offline unexpectedly
    const trackingRef = ref(db, `tracking/${userId}`);
    const onDisconnectRef = onDisconnect(trackingRef);
    onDisconnectRef.update({ status: 'offline', lastSeen: Date.now() });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      onDisconnectRef.cancel();
    };
  }, [userId]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setPath([]);
    setTripData(null);
    setError(null);
    startTimeRef.current = Date.now();

    // Update real-time status
    update(ref(db, `tracking/${userId}`), {
      status: 'active',
      name: userName || 'Unknown User',
      startTime: startTimeRef.current,
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const pt = { lat: latitude, lng: longitude, timestamp: Date.now() };

        setCurrentLocation(pt);
        setPath(prev => {
          const newPath = [...prev, pt];
          // Update RT DB with current loc and path
          set(ref(db, `tracking/${userId}/currentLocation`), pt);
          // To save space in RT DB, maybe only send current/latest. But admin needs map polyline, so send whole array or chunks.
          set(ref(db, `tracking/${userId}/path`), newPath);
          return newPath;
        });
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const stopTracking = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsTracking(false);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
      totalDistance += calculateDistance(
        path[i-1].lat, path[i-1].lng,
        path[i].lat, path[i].lng
      );
    }

    const endTime = Date.now();
    const durationMs = endTime - startTimeRef.current;

    const summary = {
      userId,
      userName: userName || 'Unknown User',
      path,
      distanceKm: totalDistance.toFixed(2),
      durationSeconds: Math.floor(durationMs / 1000),
      startTime: startTimeRef.current,
      endTime
    };

    setTripData(summary);

    // Save to completed trips
    try {
      if (path.length > 0) {
        await push(ref(db, `trips`), summary);
      }
      // Set tracking status to offline
      await update(ref(db, `tracking/${userId}`), {
        status: 'offline',
        lastSeen: Date.now()
      });
    } catch(err) {
      console.error("Error saving trip", err);
    }
  };

  return { isTracking, startTracking, stopTracking, currentLocation, path, tripData, error };
}
