
"use client"

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  path: [number, number][];
}

// مكون فرعي للتحكم في واجهة الخريطة ومتابعة المستخدم
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    // التحرك بسلاسة لموقع المستخدم الجديد
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function MapComponent({ path }: MapComponentProps) {
  // موقع افتراضي (الرياض) حتى يتم الحصول على موقع المستخدم
  const defaultCenter: [number, number] = [24.7136, 46.6753]; 
  const currentPosition = path.length > 0 ? path[path.length - 1] : defaultCenter;

  return (
    <MapContainer 
      center={currentPosition} 
      zoom={16} 
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* رسم المسار بخط أرجواني متوهج */}
      {path.length > 1 && (
        <Polyline 
          positions={path} 
          pathOptions={{ 
            color: '#8b5cf6', 
            weight: 6, 
            opacity: 0.8,
            lineJoin: 'round'
          }} 
        />
      )}
      
      {/* إظهار موقع المستخدم الحالي كنقطة متوهجة */}
      {path.length > 0 && (
        <>
          <ChangeView center={currentPosition} />
          {/* نقطة البداية */}
          <CircleMarker 
            center={path[0]} 
            radius={6} 
            pathOptions={{ 
              fillColor: '#22c55e', 
              color: 'white', 
              weight: 2, 
              fillOpacity: 1 
            }} 
          />
          {/* الموقع الحالي */}
          <CircleMarker 
            center={currentPosition} 
            radius={10} 
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
