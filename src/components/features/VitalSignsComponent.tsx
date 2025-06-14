import React, { useState, useEffect } from 'react';
import { Button } from '@/components/common';
import { VitalSign } from '@/types';
import { config } from '@/config/environment';

interface VitalSignsComponentProps {
  caseId: string;
  className?: string;
}

// デモ用のバイタルサイン生成
const generateDemoVitalSign = (): VitalSign => {
  const now = new Date();
  return {
    id: `vital-${Date.now()}`,
    timestamp: {
      toDate: () => now,
      toMillis: () => now.getTime(),
      seconds: Math.floor(now.getTime() / 1000),
      nanoseconds: 0
    } as any,
    hr: 60 + Math.floor(Math.random() * 40), // 60-100
    bp_s: 110 + Math.floor(Math.random() * 30), // 110-140
    bp_d: 60 + Math.floor(Math.random() * 20), // 60-80
    spo2: 94 + Math.floor(Math.random() * 6), // 94-99
    recordedBy: 'demo-user',
    caseId: ''
  };
};

export const VitalSignsComponent: React.FC<VitalSignsComponentProps> = ({
  caseId,
  className = ''
}) => {
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newVital, setNewVital] = useState({
    hr: '',
    bp_s: '',
    bp_d: '',
    spo2: ''
  });

  // デモモードの場合、初期データを設定
  useEffect(() => {
    if (config.demoMode) {
      const demoVitals = [
        generateDemoVitalSign(),
        generateDemoVitalSign(),
        generateDemoVitalSign()
      ];
      setVitalSigns(demoVitals);
    }
  }, []);

  const handleAddVitalSign = () => {
    if (!newVital.hr || !newVital.bp_s || !newVital.bp_d || !newVital.spo2) {
      alert('すべての項目を入力してください');
      return;
    }

    const vital: VitalSign = {
      id: `vital-${Date.now()}`,
      timestamp: {
        toDate: () => new Date(),
        toMillis: () => Date.now(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
      } as any,
      hr: parseInt(newVital.hr),
      bp_s: parseInt(newVital.bp_s),
      bp_d: parseInt(newVital.bp_d),
      spo2: parseInt(newVital.spo2),
      recordedBy: 'current-user',
      caseId
    };

    setVitalSigns([vital, ...vitalSigns]);
    setNewVital({ hr: '', bp_s: '', bp_d: '', spo2: '' });
    setShowForm(false);
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium text-gray-900">バイタルサイン</h4>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">心拍数 (bpm)</label>
              <input
                type="number"
                value={newVital.hr}
                onChange={(e) => setNewVital({ ...newVital, hr: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="70"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">SpO2 (%)</label>
              <input
                type="number"
                value={newVital.spo2}
                onChange={(e) => setNewVital({ ...newVital, spo2: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="98"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">収縮期血圧</label>
              <input
                type="number"
                value={newVital.bp_s}
                onChange={(e) => setNewVital({ ...newVital, bp_s: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="120"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">拡張期血圧</label>
              <input
                type="number"
                value={newVital.bp_d}
                onChange={(e) => setNewVital({ ...newVital, bp_d: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="80"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setNewVital({ hr: '', bp_s: '', bp_d: '', spo2: '' });
              }}
            >
              キャンセル
            </Button>
            <Button size="sm" onClick={handleAddVitalSign}>
              保存
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {vitalSigns.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            バイタルサインの記録がありません
          </p>
        ) : (
          vitalSigns.map((vital) => (
            <div key={vital.id} className="bg-gray-50 rounded p-3 text-sm">
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <span className="text-gray-600">HR:</span>{' '}
                    <span className="font-medium">{vital.hr} bpm</span>
                  </div>
                  <div>
                    <span className="text-gray-600">SpO2:</span>{' '}
                    <span className="font-medium">{vital.spo2}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">BP:</span>{' '}
                    <span className="font-medium">
                      {vital.bp_s}/{vital.bp_d} mmHg
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTime(vital.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};