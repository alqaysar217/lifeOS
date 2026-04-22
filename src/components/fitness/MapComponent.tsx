
"use client"

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";

// إصلاح مشكلة الأيقونات وتحسين الأداء للشبكات الجوالة
const fixLeafletIcons = () => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }
};

interface MapComponentProps {
  path: [number, number][];
  isStatic?: boolean;
}

function MapController({ path, isStatic }: { path: [number, number][], isStatic?: boolean }) {
  const map = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // حل مشكلة "البياض" على شبكات الجوال: إجبار الخريطة على إعادة حساب أبعادها
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    
    if (path.length === 0) return () => clearTimeout(timer);

    if (isStatic) {
      const bounds = L.latLngBounds(path);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (isFirstRender.current) {
      const currentPos = path[path.length - 1];
      map.setView(currentPos, 17);
      isFirstRender.current = false;
    }

    return () => clearTimeout(timer);
  }, [path, map, isStatic]);

  return null;
}

export default function MapComponent({ path, isStatic = false }: MapComponentProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const defaultCenter: [number, number] = [24.7136, 46.6753];
  const currentPosition = path.length > 0 ? path[path.length - 1] : defaultCenter;

  // استخدام CartoDB Voyager كمزود افتراضي لسرعته العالية على شبكات الجوال
  return (
    <MapContainer 
      center={currentPosition} 
      zoom={16} 
      scrollWheelZoom={true}
      zoomControl={false}
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: 'inherit', background: '#f8faff' }}
      className="z-0"
    >
      <LayersControl position="bottomleft">
        <LayersControl.BaseLayer checked name="الخريطة السريعة">
          <TileLayer
            attribution='&copy; CartoDB'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            crossOrigin={true}
            subdomains="abcd"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="قمر صناعي">
          <TileLayer
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            crossOrigin={true}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="تضاريس">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            crossOrigin={true}
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
          <CircleMarker 
            center={path[0]} 
            radius={6} 
            pathOptions={{ fillColor: '#22c55e', color: 'white', weight: 2, fillOpacity: 1 }} 
          />
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
