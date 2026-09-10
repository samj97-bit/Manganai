import { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import type { Target } from '../services/api';

// Fix leaflet icon paths (though we use CircleMarkers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Props {
  targets: Target[];
  layers: Record<string, boolean>;
  onTargetClick: (t: Target) => void;
  selectedTarget: Target | null;
  prospectivityGrid: Array<{ lat: number; lng: number; prospectivity: number }>;
  onCoordsChange?: (coords: string) => void;
}

// India Manganese Belt center
const CENTER: [number, number] = [20.5, 80.5];

// Custom component to handle heatmap
function HeatmapLayerComponent({ grid, show }: { grid: Array<{lat: number, lng: number, prospectivity: number}>, show: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (!show || grid.length === 0) return;
    
    // Filter high prospectivity and convert to lat,lng,intensity array
    const heatData = grid
      .filter(c => c.prospectivity > 0.5)
      .map(c => [c.lat, c.lng, c.prospectivity] as [number, number, number]);
      
    if (heatData.length === 0) return;

    // @ts-ignore - leaflet.heat adds heatLayer to L
    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.4: 'rgba(180,83,9,0.4)',
        0.6: 'rgba(180,83,9,0.8)',
        0.8: 'rgba(45,106,79,0.9)',
        1.0: 'rgba(45,106,79,1.0)',
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, grid, show]);

  return null;
}

// Custom component to handle dynamic view changes
function MapController({ selectedTarget, onCoordsChange }: { selectedTarget: Target | null, onCoordsChange?: (c: string) => void }) {
  const map = useMap();

  useEffect(() => {
    if (selectedTarget) {
      map.flyTo([selectedTarget.lat, selectedTarget.lng], 9, { duration: 1.5 });
    }
  }, [selectedTarget, map]);

  useEffect(() => {
    if (!onCoordsChange) return;
    
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      onCoordsChange(`${e.latlng.lat.toFixed(4)}°N, ${e.latlng.lng.toFixed(4)}°E`);
    };
    
    map.on('mousemove', handleMouseMove);
    return () => {
      map.off('mousemove', handleMouseMove);
    };
  }, [map, onCoordsChange]);

  return null;
}

export default function MapContainer({ targets, layers, onTargetClick, selectedTarget, prospectivityGrid, onCoordsChange }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0F172A' }}>
      <LeafletMap 
        center={CENTER} 
        zoom={6} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        {/* Esri World Imagery (High-res Earth View) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          maxZoom={18}
        />
        
        {/* Optional reference labels (places/roads) can be added as a second layer if desired */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution=""
          maxZoom={18}
        />

        <MapController selectedTarget={selectedTarget} onCoordsChange={onCoordsChange} />
        
        <HeatmapLayerComponent grid={prospectivityGrid} show={!!layers.prospectivity} />

        {/* Target markers */}
        {layers.occurrences !== false && targets.map(target => {
          const isHigh = target.priority === 'HIGH';
          const isSelected = selectedTarget?.target_id === target.target_id;
          
          return (
            <CircleMarker
              key={target.target_id}
              center={[target.lat, target.lng]}
              radius={isSelected ? 10 : (isHigh ? 7 : 5)}
              fillColor={isHigh ? '#2D6A4F' : '#B45309'}
              fillOpacity={0.8}
              color="#FFFFFF"
              weight={2}
              eventHandlers={{
                click: () => onTargetClick(target),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: '#697078', fontWeight: 600 }}>{target.target_id}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, margin: '2px 0' }}>{target.name}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 11 }}><b>{(target.prospectivity*100).toFixed(0)}%</b> prospectivity</span>
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </LeafletMap>

      {/* Map controls overlay */}
      <div className="map-controls-bar" style={{ zIndex: 1000, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', background: 'rgba(15,23,42,0.8)', color: 'white', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 4, fontSize: 11, border: '1px solid rgba(255,255,255,0.1)' }}>
          Earth View (Esri Satellite)
        </div>
      </div>

      {/* Legend overlay */}
      {layers.prospectivity && (
        <div style={{ position: 'absolute', bottom: 44, left: 12, zIndex: 1000 }}>
          <div className="map-legend" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)' }}>
            <div className="legend-title">Prospectivity</div>
            <div className="legend-items">
              <div className="legend-item"><div className="legend-swatch" style={{ background: '#2D6A4F' }} />Very High (&gt;85%)</div>
              <div className="legend-item"><div className="legend-swatch" style={{ background: '#40916C' }} />High (70–85%)</div>
              <div className="legend-item"><div className="legend-swatch" style={{ background: '#B45309' }} />Moderate (50–70%)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
