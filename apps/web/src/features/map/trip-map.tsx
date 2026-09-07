'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type?: 'DESTINATION' | 'ENTRY';
}

interface TripMapProps {
  points: MapPoint[];
}

export default function TripMap({ points }: TripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Se o mapa já estiver inicializado, apenas remove para recriar com novos pontos
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Posição inicial padrão (ou primeiro ponto)
    const initialLat = points.length > 0 ? points[0].latitude : -14.235;
    const initialLng = points.length > 0 ? points[0].longitude : -51.9253;
    const initialZoom = points.length > 0 ? 9 : 4;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], initialZoom);
    mapInstanceRef.current = map;

    // Tiles abertos gratuitos do OpenStreetMap / CartoDB Voyager
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Ícone personalizado moderno
    const defaultIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `<div style="background-color: #d97706; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const latLngs: L.LatLngTuple[] = [];

    points.forEach((pt) => {
      if (typeof pt.latitude === 'number' && typeof pt.longitude === 'number') {
        const marker = L.marker([pt.latitude, pt.longitude], { icon: defaultIcon }).addTo(map);
        marker.bindPopup(`<b>${pt.name}</b>`);
        latLngs.push([pt.latitude, pt.longitude]);
      }
    });

    // Traça linha conectando os pontos se houver mais de 1
    if (latLngs.length > 1) {
      L.polyline(latLngs, {
        color: '#d97706',
        weight: 3,
        opacity: 0.8,
        dashArray: '6, 8',
      }).addTo(map);

      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points]);

  return (
    <div className="w-full h-full min-h-[350px] rounded-2xl overflow-hidden border border-stone-200 shadow-sm relative z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px]" />
    </div>
  );
}
