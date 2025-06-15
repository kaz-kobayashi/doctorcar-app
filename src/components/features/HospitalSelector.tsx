import React, { useState, useEffect } from 'react';
import { EmergencyHospital, getNearbyHospitals, emergencyHospitals } from '@/data/emergencyHospitals';

interface HospitalSelectorProps {
  currentLocation?: { latitude: number; longitude: number };
  selectedHospital?: EmergencyHospital;
  onHospitalSelect: (hospital: EmergencyHospital) => void;
  className?: string;
}

export const HospitalSelector: React.FC<HospitalSelectorProps> = ({
  currentLocation,
  selectedHospital,
  onHospitalSelect,
  className = ''
}) => {
  const [nearbyHospitals, setNearbyHospitals] = useState<EmergencyHospital[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredHospitals, setFilteredHospitals] = useState<EmergencyHospital[]>([]);

  // 病院リストを取得（常に東京科学大学病院を含める）
  useEffect(() => {
    console.log('HospitalSelector: Loading all hospitals...');
    console.log('HospitalSelector: emergencyHospitals array:', emergencyHospitals);
    
    // 直接全病院を使用（距離制限なし）
    const allHospitals = emergencyHospitals.map(hospital => ({
      ...hospital,
      distance: 0 // ダミーの距離
    }));
    
    // 東京科学大学病院が含まれているか確認
    const tokyoScienceHospital = allHospitals.find(h => h.name === "東京科学大学病院");
    console.log('東京科学大学病院が見つかりました:', tokyoScienceHospital);
    
    console.log('HospitalSelector: All hospitals loaded:', allHospitals.length, allHospitals.map(h => h.name));
    setNearbyHospitals(allHospitals);
    setFilteredHospitals(allHospitals);
  }, []);

  // 検索フィルタリング
  useEffect(() => {
    if (!searchTerm) {
      setFilteredHospitals(nearbyHospitals);
    } else {
      const filtered = nearbyHospitals.filter(hospital =>
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredHospitals(filtered);
    }
  }, [searchTerm, nearbyHospitals]);

  const handleHospitalSelect = (hospital: EmergencyHospital) => {
    onHospitalSelect(hospital);
    setSearchTerm(hospital.name);
    setShowDropdown(false);
  };

  const getEmergencyLevelBadge = (level: string) => {
    switch (level) {
      case 'tertiary':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">三次救急</span>;
      case 'secondary':
        return <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">二次救急</span>;
      case 'primary':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">一次救急</span>;
      default:
        return null;
    }
  };

  const getSpecialtyIcons = (specialties: string[]) => {
    const iconMap: { [key: string]: string } = {
      '救急科': '🚑',
      '外科': '🔪',
      '内科': '💊',
      '循環器科': '❤️',
      '脳神経外科': '🧠',
      '整形外科': '🦴',
      '小児科': '👶',
      '産婦人科': '👩',
      '外傷科': '🩹',
      '熱傷科': '🔥',
      '感染症科': '🦠'
    };

    return specialties.slice(0, 3).map(specialty => iconMap[specialty] || '🏥').join(' ');
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        搬送先病院
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={selectedHospital ? selectedHospital.name : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="病院を検索または選択..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 現在選択中の病院情報 */}
      {selectedHospital && !showDropdown && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-blue-900">{selectedHospital.name}</span>
              {getEmergencyLevelBadge(selectedHospital.emergencyLevel)}
            </div>
            <span className="text-sm text-gray-600">
              {selectedHospital.distance?.toFixed(1)}km
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <div>{selectedHospital.address}</div>
            <div className="mt-1">
              <span className="mr-2">{getSpecialtyIcons(selectedHospital.specialties)}</span>
              {selectedHospital.specialties.slice(0, 3).join(', ')}
              {selectedHospital.specialties.length > 3 && ` 他${selectedHospital.specialties.length - 3}科`}
            </div>
            <div className="mt-1 flex space-x-3 text-xs">
              {selectedHospital.hasER && <span className="text-green-600">✓ ER</span>}
              {selectedHospital.hasICU && <span className="text-green-600">✓ ICU</span>}
              {selectedHospital.acceptsTrauma && <span className="text-green-600">✓ 外傷対応</span>}
            </div>
          </div>
        </div>
      )}

      {/* 病院選択ドロップダウン */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {filteredHospitals.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              病院が見つかりません
            </div>
          ) : (
            <div className="py-1">
              {filteredHospitals.map((hospital) => (
                <button
                  key={hospital.id}
                  onClick={() => handleHospitalSelect(hospital)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{hospital.name}</span>
                      {getEmergencyLevelBadge(hospital.emergencyLevel)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <span>{hospital.distance?.toFixed(1)}km</span>
                      <span className="text-xs">📞 {hospital.phone}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-1">
                    {hospital.address}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="mr-2">{getSpecialtyIcons(hospital.specialties)}</span>
                      {hospital.specialties.slice(0, 2).join(', ')}
                      {hospital.specialties.length > 2 && ` 他${hospital.specialties.length - 2}科`}
                    </div>
                    
                    <div className="flex space-x-2 text-xs">
                      {hospital.hasER && <span className="text-green-600">ER</span>}
                      {hospital.hasICU && <span className="text-green-600">ICU</span>}
                      {hospital.acceptsTrauma && <span className="text-green-600">外傷</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* クリックして閉じるためのオーバーレイ */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};