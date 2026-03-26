import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

function MapController({ activeUsers, selectedUser }) {
  const map = useMap();
  const firstUpdate = useRef(true);

  useEffect(() => {
    if (selectedUser && selectedUser.currentLocation) {
      map.flyTo([selectedUser.currentLocation.lat, selectedUser.currentLocation.lng], 17, {
        duration: 1.5,
      });
    } else if (activeUsers.length > 0 && firstUpdate.current) {
      const bounds = L.latLngBounds(activeUsers.filter(u => u.currentLocation).map(u => [u.currentLocation.lat, u.currentLocation.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80] });
        firstUpdate.current = false;
      }
    }
  }, [selectedUser, activeUsers, map]);

  return null;
}

export default function MapComponent({ activeUsers, selectedUser }) {
  const createCustomIcon = (status, color) => {
    const isOffline = status === 'offline';
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="position: relative; display: flex; height: 40px; width: 40px; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
          ${!isOffline ? `
            <div style="position: absolute; display: inline-flex; height: 100%; width: 100%; border-radius: 9999px; opacity: 0.4; background-color: ${color}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          ` : ''}
          <div style="position: relative; display: inline-flex; border-radius: 9999px; height: 20px; width: 20px; border-width: 3px; border-color: white; border-style: solid; box-shadow: 0 4px 12px rgba(0,0,0,0.4); background-color: ${color};"></div>
        </div>
        <style>
          @keyframes ping {
            75%, 100% { transform: scale(2.2); opacity: 0; }
          }
        </style>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#16a34a' : '#ef4444';
  };

  const defaultCenter = [20.5937, 78.9629];

  return (
    <div className="w-full h-full relative z-0" style={{ filter: 'none' }}>
      <style>{`
        .leaflet-container { background: #e8eaed !important; }
        .leaflet-tile { filter: none !important; }
        .leaflet-layer { filter: none !important; }
      `}</style>
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapController activeUsers={activeUsers} selectedUser={selectedUser} />
        {/* Google Maps Roadmap — works at all zoom levels, shows buildings, roads, & labels clearly */}
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          maxZoom={20}
        />

        {activeUsers.map(user => {
          if (!user.currentLocation) return null;

          return (
            <React.Fragment key={user.id}>
              {user.path && user.path.length > 1 && (
                <Polyline
                  positions={user.path.map(p => [p.lat, p.lng])}
                  pathOptions={{
                    color: '#2563eb',
                    weight: 5,
                    opacity: 0.85,
                    lineJoin: 'round',
                    lineCap: 'round',
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
                      {user.name || 'Unknown User'}
                    </h3>
                    <div className="text-sm text-gray-700 flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-xs">
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(user.status) }}></span>
                        {user.status === 'active' ? 'Tracking Active' : 'Offline'}
                      </span>
                      {user.currentLocation && (
                        <span className="font-mono text-[10px] opacity-70">
                          {user.currentLocation.lat.toFixed(6)}, {user.currentLocation.lng.toFixed(6)}
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
