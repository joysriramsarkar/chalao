'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LocationPoint, Driver } from '../../types';

interface MapComponentProps {
  pickup?: LocationPoint | null;
  dropoff?: LocationPoint | null;
  routePolyline?: [number, number][];
  currentPos?: [number, number];
  drivers?: Driver[];
  showDrivers?: boolean;
  className?: string;
  zoomLevel?: number;
  centerCoords?: [number, number];
}

export const MapComponent: React.FC<MapComponentProps> = ({
  pickup,
  dropoff,
  routePolyline,
  currentPos,
  drivers = [],
  showDrivers = true,
  className = 'w-full h-full min-h-[300px]',
  zoomLevel = 13,
  centerCoords = [22.5726, 88.3639] // Kolkata default
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (!mapInstanceRef.current && mapContainerRef.current && isMounted) {
        const initialCenter = pickup ? [pickup.lat, pickup.lng] : centerCoords;

        const map = L.map(mapContainerRef.current, {
          center: initialCenter as [number, number],
          zoom: zoomLevel,
          zoomControl: false,
          attributionControl: false
        });

        // CartoDB Voyager Clean Tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        L.control.zoom({ position: 'topright' }).addTo(map);

        markersGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, centerCoords[0], centerCoords[1]]);

  // Markers update
  useEffect(() => {
    if (!isClient) return;

    const updateLayers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      const markersGroup = markersGroupRef.current;
      if (!map || !markersGroup) return;

      markersGroup.clearLayers();

      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      const bounds: [number, number][] = [];

      // Pickup Marker (Green)
      if (pickup) {
        const pickupIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-emerald-500/30">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              </div>
              <div class="absolute -bottom-6 whitespace-nowrap bg-slate-900/90 text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-md">
                ${pickup.nameBn}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(markersGroup);
        bounds.push([pickup.lat, pickup.lng]);
      }

      // Dropoff Marker (Amber/Red)
      if (dropoff) {
        const dropoffIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-amber-500/30">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div class="absolute -bottom-6 whitespace-nowrap bg-slate-900/90 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 shadow-md">
                ${dropoff.nameBn}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        L.marker([dropoff.lat, dropoff.lng], { icon: dropoffIcon }).addTo(markersGroup);
        bounds.push([dropoff.lat, dropoff.lng]);
      }

      // Live Moving Vehicle Marker
      if (currentPos) {
        const movingCarIcon = L.divIcon({
          className: 'custom-moving-car',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-xl border-2 border-white ring-8 ring-emerald-500/30 animate-pulse">
                <span class="text-lg">🚖</span>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        L.marker(currentPos, { icon: movingCarIcon }).addTo(markersGroup);
        bounds.push(currentPos);
      }

      // Available Drivers around the city
      if (showDrivers && !currentPos && drivers.length > 0) {
        drivers.forEach(driver => {
          if (!driver.isOnline) return;

          const iconEmoji = 
            driver.vehicleType === 'bike' ? '🏍️' :
            driver.vehicleType === 'pink' ? '🛵' :
            driver.vehicleType === 'auto' ? '🛺' :
            driver.vehicleType === 'green' ? '⚡' : '🚗';

          const driverIcon = L.divIcon({
            className: 'custom-driver-icon',
            html: `
              <div class="relative group cursor-pointer">
                <div class="w-8 h-8 rounded-full ${driver.isBusy ? 'bg-amber-600 ring-amber-400/40' : 'bg-emerald-600 ring-emerald-400/40'} text-white flex items-center justify-center shadow-md border border-white/80 ring-4 transition-transform hover:scale-110">
                  <span class="text-sm">${iconEmoji}</span>
                </div>
                <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow border border-slate-700 pointer-events-none">
                  ${driver.name} (★${driver.rating})
                </div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(markersGroup);
          bounds.push([driver.lat, driver.lng]);
        });
      }

      // Route Polyline
      if (routePolyline && routePolyline.length > 0) {
        polylineRef.current = L.polyline(routePolyline, {
          color: '#10b981',
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        L.polyline(routePolyline, {
          color: '#059669',
          weight: 9,
          opacity: 0.25,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(markersGroup);
      }

      // Auto fit bounds
      if (bounds.length > 1) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true
        });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], zoomLevel, { animate: true });
      }
    };

    updateLayers();
  }, [isClient, pickup, dropoff, routePolyline, currentPos, drivers, showDrivers]);

  if (!isClient) {
    return (
      <div className={`bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center ${className}`}>
        <div className="text-xs text-slate-500 font-semibold animate-pulse">Loading Live GPS Map...</div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-inner border border-slate-800 ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
      <div className="absolute bottom-2 left-2 z-10 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>লাইভ জিপিএস রিয়েল-টাইম ট্র্যাকিং (India & Global)</span>
      </div>
    </div>
  );
};
