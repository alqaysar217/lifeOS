
"use client"

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  path: [number, number][];
  isStatic?: boolean;
}

// مكون ذكي للتحكم في الكاميرا وتوسيط الموقع
function MapController({ path, isStatic }: { path: [number, number][], isStatic?: boolean }) {
  const map = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (path.length === 0) return;

    if (isStatic) {
      // إذا كان مساراً تاريخياً، نقوم بضبط الخريطة لتشمل المسار بالكامل فوراً
      const bounds = L.latLngBounds(path);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (isFirstRender.current) {
      // في حالة التتبع المباشر، نضبط الكاميرا على الموقع الحالي لأول مرة فقط
      const currentPos = path[path.length - 1];
      map.setView(currentPos, 17);
      isFirstRender.current = false;
    }
  }, [path, map, isStatic]);

  return null;
}

export default function MapComponent({ path, isStatic = false }: MapComponentProps) {
  // الموقع الافتراضي في حال عدم وجود مسار
  const defaultCenter: [number, number] = [24.7136, 46.6753]; // الرياض كموقع افتراضي
  const currentPosition = path.length > 0 ? path[path.length - 1] : defaultCenter;

  return (
    <MapContainer 
      center={currentPosition} 
      zoom={16} 
      scrollWheelZoom={true}
      zoomControl={false} // سنعتمد على واجهة مخصصة أو الزويم باللمس
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: 'inherit' }}
      className="z-0"
    >
      <LayersControl position="bottomleft">
        <LayersControl.BaseLayer checked name="الوضع العادي">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="قمر صناعي">
          <TileLayer
            attribution='Map data &copy; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="تضاريس">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      
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
