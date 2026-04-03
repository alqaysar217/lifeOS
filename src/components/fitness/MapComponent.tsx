
"use client"

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  path: [number, number][];
  isStatic?: boolean;
}

// مكون ذكي للتحكم في الكاميرا دون إفساد تجربة المستخدم في الزويم
function MapController({ path, isStatic }: { path: [number, number][], isStatic?: boolean }) {
  const map = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (path.length === 0) return;

    if (isStatic) {
      // إذا كان مساراً تاريخياً، نقوم بضبط الخريطة لتشمل المسار بالكامل فوراً
      const bounds = L.latLngBounds(path);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else {
      // في حالة التتبع المباشر
      const currentPos = path[path.length - 1];
      if (isFirstRender.current) {
        map.setView(currentPos, 17);
        isFirstRender.current = false;
      } else {
        // نكتفي بالتحرك للموقع الجديد دون تغيير مستوى الزويم الذي اختاره المستخدم
        map.panTo(currentPos, { animate: true });
      }
    }
  }, [path, map, isStatic]);

  return null;
}

export default function MapComponent({ path, isStatic = false }: MapComponentProps) {
  // الموقع الافتراضي في حال عدم وجود مسار
  const defaultCenter: [number, number] = [14.536, 49.126]; 
  const currentPosition = path.length > 0 ? path[path.length - 1] : defaultCenter;

  return (
    <MapContainer 
      center={currentPosition} 
      zoom={16} 
      scrollWheelZoom={true}
      zoomControl={true}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController path={path} isStatic={isStatic} />

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
      
      {path.length > 0 && (
        <>
          {/* نقطة البداية */}
          <CircleMarker 
            center={path[0]} 
            radius={6} 
            pathOptions={{ fillColor: '#22c55e', color: 'white', weight: 2, fillOpacity: 1 }} 
          />
          {/* النقطة الحالية (فقط إذا كان التتبع نشطاً) */}
          {!isStatic && (
            <CircleMarker 
              center={currentPosition} 
              radius={10} 
              pathOptions={{ fillColor: '#8b5cf6', color: 'white', weight: 3, fillOpacity: 1 }} 
            />
          )}
        </>
      )}
    </MapContainer>
  );
}
