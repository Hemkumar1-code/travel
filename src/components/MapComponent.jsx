import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo(center, zoom, {
        duration: 1.5,
      });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ activeUsers, selectedUser }) {
  // Custom marker icon creation
  const createCustomIcon = (status, color) => {
    const isOffline = status === 'offline';
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex h-8 w-8 items-center justify-center -translate-x-1/2 -translate-y-1/2">
          ${!isOffline ? `
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style="background-color: ${color}"></span>
          ` : ''}
          <span class="relative inline-flex rounded-full h-4 w-4 border-2 border-white shadow-lg" style="background-color: ${color}"></span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#22c55e' : '#ef4444'; // green vs red
  };

  const centerRef = useRef({ lat: 20.5937, lng: 78.9629 }); // Default center (India)
  
  if (selectedUser && selectedUser.currentLocation) {
    centerRef.current = selectedUser.currentLocation;
  } else if (activeUsers.length > 0 && activeUsers[0].currentLocation) {
    centerRef.current = activeUsers[0].currentLocation;
  }

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={centerRef.current} 
        zoom={selectedUser ? 15 : 5} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapController center={centerRef.current} zoom={selectedUser ? 15 : 5} />
        
        {/* Dark theme map tiles (CartoDB Dark Matter equivalent) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {activeUsers.map(user => {
          if (!user.currentLocation) return null;
          
          return (
            <React.Fragment key={user.id}>
              {/* Draw Route Polyline if path exists */}
              {user.path && user.path.length > 1 && (
                <Polyline 
                  positions={user.path.map(p => [p.lat, p.lng])} 
                  pathOptions={{ 
                    color: getStatusColor(user.status), 
                    weight: 4, 
                    opacity: 0.6,
                    lineJoin: 'round'
                  }} 
                />
              )}

              <Marker 
                position={[user.currentLocation.lat, user.currentLocation.lng]}
                icon={createCustomIcon(user.status, getStatusColor(user.status))}
              >
                <Popup className="premium-popup">
                  <div className="p-1">
                    <h3 className="font-bold text-gray-900 border-b pb-1 mb-2">
                      {user.name || 'Unknown'}
                    </h3>
                    <div className="text-sm text-gray-700 flex flex-col gap-1">
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${user.status==='active'?'bg-green-500':'bg-red-500'}`}></span>
                        {user.status === 'active' ? 'Tracking Active' : 'Offline'}
                      </span>
                      {user.currentLocation && (
                         <span className="font-mono text-xs opacity-70">
                           {user.currentLocation.lat.toFixed(4)}, {user.currentLocation.lng.toFixed(4)}
                         </span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
