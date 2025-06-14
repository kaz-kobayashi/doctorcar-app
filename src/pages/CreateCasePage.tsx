import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, LoadingSpinner } from '@/components/common';
import { useCaseStore, useAuthStore } from '@/stores';
import { Case } from '@/types';
import { CASE_STATUS } from '@/constants';

export const CreateCasePage: React.FC = () => {
  const navigate = useNavigate();
  const { createCase, loading } = useCaseStore();
  const { userInfo } = useAuthStore();
  const [formData, setFormData] = useState({
    caseName: '',
    patientAge: '',
    patientGender: 'male' as 'male' | 'female' | 'other',
    patientName: '',
    sceneLatitude: '',
    sceneLongitude: '',
    hospitalLatitude: '',
    hospitalLongitude: '',
    description: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            sceneLatitude: position.coords.latitude.toString(),
            sceneLongitude: position.coords.longitude.toString()
          });
        },
        (error) => {
          console.error('位置情報の取得に失敗しました:', error);
          alert('位置情報の取得に失敗しました。手動で座標を入力してください。');
        }
      );
    } else {
      alert('このブラウザでは位置情報がサポートされていません。');
    }
  };

  const setPresetLocation = (type: 'scene' | 'hospital', preset: string) => {
    const presets = {
      '渋谷駅': { lat: '35.658584', lng: '139.701442' },
      '新宿駅': { lat: '35.689487', lng: '139.691706' },
      '品川駅': { lat: '35.627701', lng: '139.740689' },
      '東京大学病院': { lat: '35.665498', lng: '139.686567' },
      '慶應義塾大学病院': { lat: '35.649519', lng: '139.701754' },
      '東京医科大学病院': { lat: '35.693176', lng: '139.705148' }
    };

    const location = presets[preset as keyof typeof presets];
    if (location) {
      if (type === 'scene') {
        setFormData({
          ...formData,
          sceneLatitude: location.lat,
          sceneLongitude: location.lng
        });
      } else {
        setFormData({
          ...formData,
          hospitalLatitude: location.lat,
          hospitalLongitude: location.lng
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.caseName.trim()) {
      alert('事案名を入力してください');
      return;
    }

    if (!formData.sceneLatitude || !formData.sceneLongitude) {
      alert('現場の位置情報を入力してください');
      return;
    }

    if (!formData.hospitalLatitude || !formData.hospitalLongitude) {
      alert('搬送先病院の位置情報を入力してください');
      return;
    }

    try {
      // モック用のGeoPointとTimestamp作成
      const createMockGeoPoint = (lat: number, lng: number) => ({
        latitude: lat,
        longitude: lng,
        isEqual: (other: any) => other.latitude === lat && other.longitude === lng,
        toJSON: () => ({ latitude: lat, longitude: lng })
      });

      const createMockTimestamp = (date: Date) => ({
        toDate: () => date,
        toMillis: () => date.getTime(),
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: (date.getTime() % 1000) * 1000000
      });

      const newCase: Omit<Case, 'id'> = {
        caseName: formData.caseName.trim(),
        status: CASE_STATUS.DISPATCHED,
        teamId: userInfo?.uid || 'demo-user',
        patientInfo: {
          age: formData.patientAge ? parseInt(formData.patientAge) : undefined,
          gender: formData.patientGender,
          name: formData.patientName.trim() || undefined
        },
        sceneLocation: createMockGeoPoint(
          parseFloat(formData.sceneLatitude),
          parseFloat(formData.sceneLongitude)
        ) as any,
        hospitalLocation: createMockGeoPoint(
          parseFloat(formData.hospitalLatitude),
          parseFloat(formData.hospitalLongitude)
        ) as any,
        createdAt: createMockTimestamp(new Date()) as any,
        updatedAt: createMockTimestamp(new Date()) as any
      };

      const caseId = await createCase(newCase);
      alert('新規事案を作成しました');
      navigate(`/cases/${caseId}`);
    } catch (error) {
      console.error('事案作成エラー:', error);
      alert('事案の作成に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/cases')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">新規事案作成</h1>
            </div>
            
            <div className="text-sm text-gray-700">
              <span className="font-medium">{userInfo?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">基本情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    事案名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.caseName}
                    onChange={(e) => handleInputChange('caseName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
                    placeholder="例: 2024-06-14 渋谷駅前 交通外傷"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    担当チーム
                  </label>
                  <input
                    type="text"
                    value={userInfo?.team || ''}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* 患者情報 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">患者情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    患者氏名
                  </label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
                    placeholder="氏名（任意）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年齢
                  </label>
                  <input
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) => handleInputChange('patientAge', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
                    placeholder="年齢"
                    min="0"
                    max="150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性別
                  </label>
                  <select
                    value={formData.patientGender}
                    onChange={(e) => handleInputChange('patientGender', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
                  >
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 現場位置 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">現場位置</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                  >
                    現在地を取得
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetLocation('scene', '渋谷駅')}
                  >
                    渋谷駅
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetLocation('scene', '新宿駅')}
                  >
                    新宿駅
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetLocation('scene', '品川駅')}
                  >
                    品川駅
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      緯度 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.sceneLatitude}
                      onChange={(e) => handleInputChange('sceneLatitude', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
                      placeholder="35.658584"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      経度 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.sceneLongitude}
                      onChange={(e) => handleInputChange('sceneLongitude', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
                      placeholder="139.701442"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 搬送先病院 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">搬送先病院</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetLocation('hospital', '東京大学病院')}
                  >
                    東京大学病院
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetLocation('hospital', '慶應義塾大学病院')}
                  >
                    慶應義塾大学病院
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetLocation('hospital', '東京医科大学病院')}
                  >
                    東京医科大学病院
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      緯度 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.hospitalLatitude}
                      onChange={(e) => handleInputChange('hospitalLatitude', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
                      placeholder="35.665498"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      経度 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.hospitalLongitude}
                      onChange={(e) => handleInputChange('hospitalLongitude', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
                      placeholder="139.686567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/cases')}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center"
              >
                {loading && <LoadingSpinner size="sm" className="mr-2" />}
                事案を作成
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};