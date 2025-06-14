import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  latitude: number;
  longitude: number;
}

interface MapComponentProps {
  sceneLocation?: Location;
  hospitalLocation?: Location;
  currentLocation?: Location;
  className?: string;
}

// マーカーアイコンの定義
const createIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="white"/>
    </svg>
  `)}`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40]
});

const sceneIcon = createIcon('#DC2626'); // 赤
const hospitalIcon = createIcon('#2563EB'); // 青
const currentIcon = createIcon('#10B981'); // 緑

// マップの中心を更新するコンポーネント
const MapUpdater: React.FC<{ center: LatLngExpression }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  sceneLocation,
  hospitalLocation,
  currentLocation,
  className = ''
}) => {
  // デモモード用の東京周辺の座標
  const defaultCenter: LatLngExpression = [35.6762, 139.6503];
  const [center, setCenter] = useState<LatLngExpression>(defaultCenter);
  
  useEffect(() => {
    if (sceneLocation) {
      setCenter([sceneLocation.latitude, sceneLocation.longitude]);
    } else if (hospitalLocation) {
      setCenter([hospitalLocation.latitude, hospitalLocation.longitude]);
    } else if (currentLocation) {
      setCenter([currentLocation.latitude, currentLocation.longitude]);
    }
  }, [sceneLocation, hospitalLocation, currentLocation]);
  
  return (
    <div className={`h-full w-full ${className}`}>
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full rounded-lg"
        style={{ minHeight: '300px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} />
        
        {/* 現場位置 */}
        {sceneLocation && (
          <Marker
            position={[sceneLocation.latitude, sceneLocation.longitude]}
            icon={sceneIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>現場</strong><br />
                緯度: {sceneLocation.latitude.toFixed(6)}<br />
                経度: {sceneLocation.longitude.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* 搬送先病院 */}
        {hospitalLocation && (
          <Marker
            position={[hospitalLocation.latitude, hospitalLocation.longitude]}
            icon={hospitalIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>搬送先病院</strong><br />
                緯度: {hospitalLocation.latitude.toFixed(6)}<br />
                経度: {hospitalLocation.longitude.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* 現在地 */}
        {currentLocation && (
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={currentIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>現在地</strong><br />
                緯度: {currentLocation.latitude.toFixed(6)}<br />
                経度: {currentLocation.longitude.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};