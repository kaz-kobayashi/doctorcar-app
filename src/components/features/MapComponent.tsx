import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OptimizedRoute } from '@/types/route';
import { EmergencyHospital } from '@/data/emergencyHospitals';
import { Modal } from '@/components/common';

interface Location {
  latitude: number;
  longitude: number;
}

interface MapComponentProps {
  sceneLocation?: Location;
  hospitalLocation?: Location;
  currentLocation?: Location;
  selectedRoute?: OptimizedRoute;
  // routeWaypoints?: RoutePoint[]; // 使用停止
  selectedHospital?: EmergencyHospital;
  showFullscreenButton?: boolean;
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
// const waypointIcon = createIcon('#F59E0B'); // オレンジ - 使用停止

// マップの中心を更新するコンポーネント
const MapUpdater: React.FC<{ center: LatLngExpression }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

// マップサイズを無効化して再描画を強制するコンポーネント
const MapResizer: React.FC<{ isFullscreen?: boolean }> = ({ isFullscreen = false }) => {
  const map = useMap();
  
  useEffect(() => {
    // マップがフルスクリーンに切り替わった時にサイズを再計算
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map, isFullscreen]);
  
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  sceneLocation,
  hospitalLocation,
  currentLocation,
  selectedRoute,
  // routeWaypoints, // 使用停止
  selectedHospital,
  showFullscreenButton = true,
  className = ''
}) => {
  // デモモード用の東京周辺の座標
  const defaultCenter: LatLngExpression = [35.6762, 139.6503];
  const [center, setCenter] = useState<LatLngExpression>(defaultCenter);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useEffect(() => {
    if (sceneLocation) {
      setCenter([sceneLocation.latitude, sceneLocation.longitude]);
    } else if (hospitalLocation) {
      setCenter([hospitalLocation.latitude, hospitalLocation.longitude]);
    } else if (currentLocation) {
      setCenter([currentLocation.latitude, currentLocation.longitude]);
    }
  }, [sceneLocation, hospitalLocation, currentLocation]);

  // フルスクリーンモードが変更された時の追加処理
  useEffect(() => {
    if (isFullscreen) {
      // フルスクリーンモードになった時は少し遅延を入れてからサイズを再計算
      const timer = setTimeout(() => {
        // DOM更新を待つ
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);
  
  const renderMap = (isFullscreenMode: boolean = false) => (
    <div className={`h-full w-full relative ${isFullscreenMode ? '' : className}`}>
      <MapContainer
        key={isFullscreenMode ? 'fullscreen-map' : 'normal-map'}
        center={center}
        zoom={isFullscreenMode ? 15 : 13}
        className={`h-full w-full ${isFullscreenMode ? '' : 'rounded-lg'}`}
        style={{ minHeight: isFullscreenMode ? '100vh' : '300px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} />
        <MapResizer isFullscreen={isFullscreenMode} />
        
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
        {(hospitalLocation || selectedHospital) && (
          <Marker
            position={[
              selectedHospital?.latitude || hospitalLocation!.latitude,
              selectedHospital?.longitude || hospitalLocation!.longitude
            ]}
            icon={hospitalIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>{selectedHospital?.name || '搬送先病院'}</strong><br />
                {selectedHospital && (
                  <>
                    {selectedHospital.address}<br />
                    📞 {selectedHospital.phone}<br />
                    🏥 {selectedHospital.specialties.slice(0, 3).join(', ')}<br />
                  </>
                )}
                緯度: {(selectedHospital?.latitude || hospitalLocation!.latitude).toFixed(6)}<br />
                経度: {(selectedHospital?.longitude || hospitalLocation!.longitude).toFixed(6)}
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
        
        {/* 選択されたルートの表示 */}
        {selectedRoute && selectedRoute.coordinates && selectedRoute.coordinates.length > 1 && (
          <>
            {/* フルスクリーン時のルートデータ確認 */}
            {isFullscreenMode && selectedRoute && console.log('フルスクリーンでルート表示:', selectedRoute.coordinates.length, '座標')}
            <Polyline
              positions={selectedRoute.coordinates.map(coord => [coord.latitude, coord.longitude] as LatLngExpression)}
              color={isFullscreenMode ? "#FF6B35" : "#3B82F6"}
              weight={isFullscreenMode ? 6 : 4}
              opacity={0.9}
            />
            {/* デバッグ用: ルート開始点と終了点にマーカー */}
            <Marker
              position={[selectedRoute.coordinates[0].latitude, selectedRoute.coordinates[0].longitude]}
              icon={createIcon('#00FF00')} // 緑
            >
              <Popup>
                <div className="text-sm">
                  <strong>ルート開始点 {isFullscreenMode ? '(フルスクリーン)' : ''}</strong><br />
                  緯度: {selectedRoute.coordinates[0].latitude.toFixed(6)}<br />
                  経度: {selectedRoute.coordinates[0].longitude.toFixed(6)}<br />
                  座標数: {selectedRoute.coordinates.length}
                </div>
              </Popup>
            </Marker>
            <Marker
              position={[selectedRoute.coordinates[selectedRoute.coordinates.length - 1].latitude, selectedRoute.coordinates[selectedRoute.coordinates.length - 1].longitude]}
              icon={createIcon('#FF0000')} // 赤
            >
              <Popup>
                <div className="text-sm">
                  <strong>ルート終了点 {isFullscreenMode ? '(フルスクリーン)' : ''}</strong><br />
                  緯度: {selectedRoute.coordinates[selectedRoute.coordinates.length - 1].latitude.toFixed(6)}<br />
                  経度: {selectedRoute.coordinates[selectedRoute.coordinates.length - 1].longitude.toFixed(6)}<br />
                  座標数: {selectedRoute.coordinates.length}
                </div>
              </Popup>
            </Marker>
          </>
        )}
        
        {/* ルートのウェイポイント - 表示無効化 */}
        {/* 
        {routeWaypoints && routeWaypoints.map((waypoint, index) => (
          <Marker
            key={`waypoint-${index}`}
            position={[waypoint.latitude, waypoint.longitude]}
            icon={waypointIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>ウェイポイント {index + 1}</strong><br />
                {waypoint.name && <span>{waypoint.name}<br /></span>}
                緯度: {waypoint.latitude.toFixed(6)}<br />
                経度: {waypoint.longitude.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        ))}
        */}
      </MapContainer>
      
      {/* フルスクリーンボタン */}
      {showFullscreenButton && !isFullscreenMode && (
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2 right-2 z-[1000] bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-lg p-3 transition-colors border border-blue-600"
          title="地図を全画面表示"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}
      
      {/* 地図凡例 */}
      {isFullscreenMode && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white shadow-lg rounded-lg p-3 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">凡例</h4>
          <div className="space-y-1 text-xs">
            {sceneLocation && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span>現場</span>
              </div>
            )}
            {(hospitalLocation || selectedHospital) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>搬送先病院</span>
              </div>
            )}
            {currentLocation && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>現在地</span>
              </div>
            )}
            {selectedRoute && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-blue-500 rounded"></div>
                <span>最適ルート</span>
              </div>
            )}
            {/* ウェイポイント凡例は非表示
            {routeWaypoints && routeWaypoints.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span>ウェイポイント</span>
              </div>
            )}
            */}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div>🖱️ ドラッグ: 地図移動</div>
              <div>🔍 スクロール: ズーム</div>
              <div>📍 マーカークリック: 詳細表示</div>
            </div>
          </div>
        </div>
      )}
      
      {/* フルスクリーン時の追加コントロール */}
      {isFullscreenMode && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
          <button
            onClick={() => {
              // 地図の中心を再設定
              setCenter(sceneLocation ? [sceneLocation.latitude, sceneLocation.longitude] : defaultCenter);
            }}
            className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50 transition-colors border border-gray-200"
            title="現場中心に表示"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {/* デバッグ情報パネル */}
          <div className="bg-gray-800 text-white text-xs p-2 rounded-lg max-w-48">
            <div>ルート: {selectedRoute ? '✓' : '✗'}</div>
            <div>座標数: {selectedRoute?.coordinates?.length || 0}</div>
            {/* <div>ウェイポイント: {routeWaypoints?.length || 0}</div> */}
            {!selectedRoute && (
              <div className="mt-2 text-yellow-300">
                ※ ルート最適化を実行してください
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderMap(false)}
      
      {/* フルスクリーンモーダル */}
      <Modal 
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        size="full"
        title="地図 - 全画面表示"
      >
        <div className="h-full">
          {renderMap(true)}
        </div>
      </Modal>
    </>
  );
};