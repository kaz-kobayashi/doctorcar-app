import React, { useState, useEffect } from 'react';
import { Button } from '@/components/common';
import { Treatment } from '@/types';
import { config } from '@/config/environment';

interface TreatmentComponentProps {
  caseId: string;
  className?: string;
}

// 一般的な処置のプリセット
const PRESET_TREATMENTS = [
  'バイタル測定',
  '酸素投与開始',
  '静脈路確保',
  '心電図モニタリング開始',
  '体位変換',
  '体温管理',
  '創部処置',
  '疼痛管理',
  '薬剤投与',
  '気道確保'
];

// デモ用処置データ生成
const generateDemoTreatments = (): Treatment[] => {
  const now = new Date();
  return [
    {
      id: 'treatment-1',
      timestamp: {
        toDate: () => new Date(now.getTime() - 20 * 60 * 1000),
        toMillis: () => now.getTime() - 20 * 60 * 1000,
        seconds: Math.floor((now.getTime() - 20 * 60 * 1000) / 1000),
        nanoseconds: 0
      } as any,
      name: 'バイタル測定',
      details: 'HR: 85bpm, BP: 120/80mmHg, SpO2: 98%',
      recordedBy: '山田 太郎',
      caseId: ''
    },
    {
      id: 'treatment-2',
      timestamp: {
        toDate: () => new Date(now.getTime() - 15 * 60 * 1000),
        toMillis: () => now.getTime() - 15 * 60 * 1000,
        seconds: Math.floor((now.getTime() - 15 * 60 * 1000) / 1000),
        nanoseconds: 0
      } as any,
      name: '酸素投与開始',
      details: 'マスク 4L/min',
      recordedBy: '山田 太郎',
      caseId: ''
    }
  ];
};

export const TreatmentComponent: React.FC<TreatmentComponentProps> = ({
  caseId,
  className = ''
}) => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    name: '',
    details: ''
  });

  // デモモードの場合、初期データを設定
  useEffect(() => {
    if (config.demoMode) {
      setTreatments(generateDemoTreatments());
    }
  }, []);

  const formatTime = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const addTreatment = (name: string, details: string = '') => {
    if (!name.trim()) {
      alert('処置名を入力してください');
      return;
    }

    const treatment: Treatment = {
      id: `treatment-${Date.now()}`,
      timestamp: {
        toDate: () => new Date(),
        toMillis: () => Date.now(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
      } as any,
      name: name.trim(),
      details: details.trim(),
      recordedBy: 'current-user',
      caseId
    };

    setTreatments([treatment, ...treatments]);
    setNewTreatment({ name: '', details: '' });
    setShowForm(false);
    setShowPresets(false);
  };

  const handlePresetSelect = (preset: string) => {
    setNewTreatment({ ...newTreatment, name: preset });
    setShowPresets(false);
  };

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium text-gray-900">処置記録</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
        >
          記録追加
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">処置名</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTreatment.name}
                  onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border rounded"
                  placeholder="処置名を入力"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPresets(!showPresets)}
                >
                  選択
                </Button>
              </div>
              
              {showPresets && (
                <div className="mt-2 p-2 bg-white border rounded max-h-32 overflow-y-auto">
                  <div className="text-xs text-gray-600 mb-1">処置を選択:</div>
                  <div className="space-y-1">
                    {PRESET_TREATMENTS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handlePresetSelect(preset)}
                        className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100 rounded"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">詳細・備考</label>
              <textarea
                value={newTreatment.details}
                onChange={(e) => setNewTreatment({ ...newTreatment, details: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded resize-none"
                rows={2}
                placeholder="詳細や数値など"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setShowPresets(false);
                setNewTreatment({ name: '', details: '' });
              }}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={() => addTreatment(newTreatment.name, newTreatment.details)}
            >
              保存
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {treatments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            処置記録がありません
          </p>
        ) : (
          treatments.map((treatment) => (
            <div key={treatment.id} className="bg-gray-50 rounded p-3 text-sm">
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-gray-900">{treatment.name}</div>
                <span className="text-xs text-gray-500">
                  {formatTime(treatment.timestamp)}
                </span>
              </div>
              {treatment.details && (
                <div className="text-gray-600 text-xs mb-1">
                  {treatment.details}
                </div>
              )}
              <div className="text-xs text-gray-500">
                記録者: {treatment.recordedBy}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};