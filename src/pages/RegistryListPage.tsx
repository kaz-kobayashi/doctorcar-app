import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, LoadingSpinner } from '@/components/common';
import { DoctorCarRegistry } from '@/types/registry';
import { registryService } from '@/services/registryService';

export const RegistryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [registries, setRegistries] = useState<DoctorCarRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadRegistries();
  }, []);

  const loadRegistries = async () => {
    setLoading(true);
    try {
      const data = await registryService.getCompletedRegistries();
      setRegistries(data.sort((a, b) => {
        const aTime = a.timelineDoctorCar?.awareness?.toDate?.()?.getTime() || 0;
        const bTime = b.timelineDoctorCar?.awareness?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      }));
    } catch (error) {
      console.error('Failed to load registries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const csv = await registryService.exportRegistriesToCSV(registries);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `doctorcar_registry_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('CSVエクスポートに失敗しました');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return '-';
    return timestamp.toDate().toLocaleDateString('ja-JP');
  };

  const formatTime = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return '-';
    return timestamp.toDate().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case 'C': return 'bg-red-100 text-red-800';
      case 'T': return 'bg-orange-100 text-orange-800';
      case 'S': return 'bg-blue-100 text-blue-800';
      case 'M': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDestinationText = (type?: string): string => {
    switch (type) {
      case 'own-tertiary': return '自院三次';
      case 'own-secondary': return '自院二次';
      case 'other-tertiary': return '他院三次';
      case 'other-secondary': return '他院二次';
      case 'cancel-before-arrival': return '現着前キャンセル';
      case 'cancel-mild': return '軽症キャンセル';
      case 'social-death': return '社会死';
      case 'other': return 'その他';
      default: return '-';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">レジストリ一覧</h1>
                <p className="text-sm text-gray-500">
                  完了済みレジストリ: {registries.length}件
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleExportCSV}
                disabled={exporting || registries.length === 0}
              >
                CSVエクスポート
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* レジストリ一覧 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {registries.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">完了済みのレジストリがありません</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        レジストリ番号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        要請日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        患者情報
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        推定病名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        搬送先
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        分類
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        転帰
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        活動時間
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registries.map((registry) => (
                      <tr key={registry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {registry.registryNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{formatDate(registry.timelineDoctorCar?.awareness)}</div>
                          <div className="text-xs">{formatTime(registry.timelineDoctorCar?.awareness)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {registry.patientAge}歳 
                          {registry.patientGender === 'male' ? '男性' : 
                           registry.patientGender === 'female' ? '女性' : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs truncate">
                            {registry.estimatedDiagnosis?.join(', ') || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getDestinationText(registry.destination?.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(registry.category || undefined)}`}>
                            {registry.category || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getDestinationText(registry.destination?.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {registry.totalActivityTime ? `${registry.totalActivityTime}分` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};