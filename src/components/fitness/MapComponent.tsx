
"use client"

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  path: [number, number][];
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function MapComponent({ path }: MapComponentProps) {
  const defaultCenter: [number, number] = [24.7136, 46.6753]; // Riyadh as default
  const center = path.length > 0 ? path[path.length - 1] : defaultCenter;

  return (
    <MapContainer 
      center={center} 
      zoom={16} 
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {path.length > 1 && (
        <Polyline 
          positions={path} 
          pathOptions={{ color: '#8b5cf6', weight: 6, opacity: 0.8 }} 
        />
      )}
      {path.length > 0 && (
        <>
          <ChangeView center={center} />
          <CircleMarker 
            center={center} 
            radius={8} 
            pathOptions={{ 
              fillColor: '#8b5cf6', 
              color: 'white', 
              weight: 3, 
              fillOpacity: 1 
            }} 
          />
        </>
      )}
    </MapContainer>
  );
}
