
"use client"

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  path: [number, number][];
}

// مكون فرعي للتحكم في واجهة الخريطة ومتابعة المستخدم مع زويم عالي
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    // التحرك بسلاسة لموقع المستخدم الجديد مع الحفاظ على مستوى زويم عالٍ جداً (18)
    map.setView(center, 18, { animate: true });
  }, [center, map]);
  return null;
}

export default function MapComponent({ path }: MapComponentProps) {
  // الموقع الافتراضي: مدينة المكلا، اليمن
  const defaultCenter: [number, number] = [14.536, 49.126]; 
  const currentPosition = path.length > 0 ? path[path.length - 1] : defaultCenter;

  return (
    <MapContainer 
      center={currentPosition} 
      zoom={18} // زويم عالٍ جداً لرؤية تفاصيل الشوارع
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        // استخدام نمط ملون وواضح من OpenStreetMap
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* رسم المسار بخط أرجواني متوهج وواضح */}
      {path.length > 1 && (
        <Polyline 
          positions={path} 
          pathOptions={{ 
            color: '#8b5cf6', 
            weight: 8, // زيادة سمك الخط ليكون واضحاً مع الزويم العالي
            opacity: 0.9,
            lineJoin: 'round'
          }} 
        />
      )}
      
      {/* إظهار موقع المستخدم الحالي كنقطة متوهجة */}
      {path.length > 0 ? (
        <>
          <ChangeView center={currentPosition} />
          {/* نقطة البداية بلون أخضر */}
          <CircleMarker 
            center={path[0]} 
            radius={7} 
            pathOptions={{ 
              fillColor: '#22c55e', 
              color: 'white', 
              weight: 2, 
              fillOpacity: 1 
            }} 
          />
          {/* الموقع الحالي بلون أرجواني كبير */}
          <CircleMarker 
            center={currentPosition} 
            radius={12} 
            pathOptions={{ 
              fillColor: '#8b5cf6', 
              color: 'white', 
              weight: 3, 
              fillOpacity: 1 
            }} 
          />
        </>
      ) : (
        // إذا لم يبدأ التتبع بعد، نظهر نقطة ثابتة في المكلا للتمثيل
        <CircleMarker 
          center={defaultCenter} 
          radius={8} 
          pathOptions={{ 
            fillColor: '#8b5cf6', 
            color: 'white', 
            weight: 2, 
            fillOpacity: 0.5 
          }} 
        />
      )}
    </MapContainer>
  );
}
