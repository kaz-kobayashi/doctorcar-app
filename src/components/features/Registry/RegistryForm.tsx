import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, LoadingSpinner } from '@/components/common';
import { DoctorCarRegistry, TeamMemberOnScene } from '@/types/registry';
import { useCaseStore, useAuthStore } from '@/stores';
import { registryService } from '@/services/registryService';
import { TeamMemberSelector } from './TeamMemberSelector';

export const RegistryForm: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { currentCase } = useCaseStore();
  const { userInfo } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registry, setRegistry] = useState<Partial<DoctorCarRegistry>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'team' | 'timeline' | 'vitals' | 'category' | 'hospital'>('basic');

  useEffect(() => {
    if (caseId) {
      loadExistingRegistry();
    }
  }, [caseId]);

  const loadExistingRegistry = async () => {
    if (!caseId) return;
    
    setLoading(true);
    try {
      const existingRegistry = await registryService.getRegistryByCaseId(caseId);
      if (existingRegistry) {
        setRegistry(existingRegistry);
      } else {
        // 新規作成時は基本情報と時間経過のデフォルト値を初期化
        const now = new Date();
        const createDefaultTimestamp = (minutesOffset: number) => ({
          toDate: () => {
            const time = new Date(now);
            time.setMinutes(time.getMinutes() + minutesOffset);
            return time;
          }
        });

        setRegistry({
          caseId,
          registryNumber: generateRegistryNumber(),
          createdBy: userInfo?.uid || '',
          isCompleted: false,
          teamMembers: [], // 空の配列で初期化
          // 時間経過のデフォルト値を設定
          timelineEms: {
            awareness: createDefaultTimestamp(0) as any,
            arrival: createDefaultTimestamp(10) as any,
            contact: createDefaultTimestamp(15) as any,
            departure: createDefaultTimestamp(45) as any,
            hospitalArrival: createDefaultTimestamp(60) as any
          },
          timelineDoctorCar: {
            awareness: createDefaultTimestamp(5) as any,
            arrival: createDefaultTimestamp(15) as any,
            contact: createDefaultTimestamp(20) as any,
            departure: createDefaultTimestamp(50) as any,
            hospitalArrival: createDefaultTimestamp(65) as any
          }
        });
      }
    } catch (error) {
      console.error('Failed to load registry:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRegistryNumber = (): string => {
    const date = new Date();
    return `DCR-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleTeamMembersChange = (members: TeamMemberOnScene[]) => {
    setRegistry(prev => ({
      ...prev,
      teamMembers: members
    }));
  };

  const handleSave = async (isComplete: boolean = false) => {
    setSaving(true);
    try {
      const updatedRegistry: any = {
        ...registry,
        isCompleted: isComplete,
        updatedBy: userInfo?.uid || '',
        updatedAt: { toDate: () => new Date() } as any
      };

      if (isComplete) {
        updatedRegistry.submittedAt = { toDate: () => new Date() } as any;
      }

      await registryService.saveRegistry(updatedRegistry);
      
      if (isComplete) {
        alert('レジストリの提出が完了しました');
        navigate(`/cases/${caseId}`);
      } else {
        alert('保存しました');
      }
    } catch (error) {
      console.error('Failed to save registry:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
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
                onClick={() => navigate(`/cases/${caseId}`)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">ドクターカーレジストリ</h1>
                <p className="text-sm text-gray-500">
                  {currentCase?.caseName} | レジストリ番号: {registry.registryNumber}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                一時保存
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                提出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* タブナビゲーション */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'basic', label: 'I 基本情報' },
                { id: 'team', label: '現場メンバー' },
                { id: 'timeline', label: '時間経過・バイタル' },
                { id: 'vitals', label: '搬送先・分類' },
                { id: 'category', label: 'II 分類別詳細' },
                { id: 'hospital', label: 'III 院内経過' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-medical-primary text-medical-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">
            {activeTab === 'basic' && <BasicInfoTab registry={registry} setRegistry={setRegistry} />}
            {activeTab === 'team' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">現場活動メンバー</h3>
                <p className="text-sm text-gray-600 mb-6">
                  現場に出動したメンバーを選択し、到着時刻や役割を記録してください。
                </p>
                <TeamMemberSelector
                  selectedMembers={registry.teamMembers || []}
                  onMembersChange={handleTeamMembersChange}
                />
              </div>
            )}
            {activeTab === 'timeline' && <TimelineTab registry={registry} setRegistry={setRegistry} />}
            {activeTab === 'vitals' && <VitalsDestinationTab registry={registry} setRegistry={setRegistry} />}
            {activeTab === 'category' && <CategoryTab registry={registry} setRegistry={setRegistry} />}
            {activeTab === 'hospital' && <HospitalTab registry={registry} setRegistry={setRegistry} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// I 基本情報タブ（省略 - 既存のコードと同じ）
const BasicInfoTab: React.FC<{
  registry: Partial<DoctorCarRegistry>;
  setRegistry: React.Dispatch<React.SetStateAction<Partial<DoctorCarRegistry>>>;
}> = ({ registry, setRegistry }) => {
  return (
    <div className="space-y-8">
      {/* 患者基本情報 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">患者基本情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              患者番号
            </label>
            <Input
              type="text"
              value={registry.patientNumber || ''}
              onChange={(e) => setRegistry({ ...registry, patientNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              患者年齢
            </label>
            <Input
              type="number"
              value={registry.patientAge || ''}
              onChange={(e) => setRegistry({ ...registry, patientAge: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              性別
            </label>
            <div className="flex space-x-4 mt-1">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={registry.patientGender === 'male'}
                  onChange={() => setRegistry({ ...registry, patientGender: 'male' })}
                  className="mr-2"
                />
                男
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={registry.patientGender === 'female'}
                  onChange={() => setRegistry({ ...registry, patientGender: 'female' })}
                  className="mr-2"
                />
                女
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 医療機関情報 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">医療機関情報</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { value: 'disaster', label: '災害' },
            { value: 'medical-dental', label: '医科歯科' },
            { value: 'nagayama', label: '永山' },
            { value: 'sengaki', label: '千駄木' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="medicalInstitution"
                value={option.value}
                checked={registry.medicalInstitution === option.value}
                onChange={(e) => setRegistry({ ...registry, medicalInstitution: e.target.value as any })}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* ドクターカー出動要請基準 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">ドクターカー出動要請基準</h3>
        
        {/* Category I */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={registry.dispatchCriteria?.category1 || false}
              onChange={(e) => setRegistry({
                ...registry,
                dispatchCriteria: {
                  ...registry.dispatchCriteria!,
                  category1: e.target.checked
                }
              })}
              className="mr-2"
            />
            <span className="font-medium">I 心停止</span>
          </label>
        </div>

        {/* Category II */}
        <div className="mb-4">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={registry.dispatchCriteria?.category2?.selected || false}
              onChange={(e) => setRegistry({
                ...registry,
                dispatchCriteria: {
                  ...registry.dispatchCriteria!,
                  category2: {
                    ...registry.dispatchCriteria?.category2!,
                    selected: e.target.checked
                  }
                }
              })}
              className="mr-2"
            />
            <span className="font-medium">II 心停止寸前を疑う</span>
          </label>
          <div className="ml-6 space-y-2">
            {[
              { key: 'breathing', label: '① 呼吸の異常' },
              { key: 'circulation', label: '② 循環の異常' },
              { key: 'consciousness', label: '③ 意識の異常' }
            ].map((item) => (
              <label key={item.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={registry.dispatchCriteria?.category2?.[item.key as keyof typeof registry.dispatchCriteria.category2] || false}
                  onChange={(e) => setRegistry({
                    ...registry,
                    dispatchCriteria: {
                      ...registry.dispatchCriteria!,
                      category2: {
                        ...registry.dispatchCriteria?.category2!,
                        [item.key]: e.target.checked
                      }
                    }
                  })}
                  className="mr-2"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        {/* Category III */}
        <div className="mb-4">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={registry.dispatchCriteria?.category3?.selected || false}
              onChange={(e) => setRegistry({
                ...registry,
                dispatchCriteria: {
                  ...registry.dispatchCriteria!,
                  category3: {
                    ...registry.dispatchCriteria?.category3!,
                    selected: e.target.checked
                  }
                }
              })}
              className="mr-2"
            />
            <span className="font-medium">III 外因によるもの</span>
          </label>
          <div className="ml-6 space-y-2">
            {[
              { key: 'fall', label: '① 転落・墜落' },
              { key: 'traffic', label: '② 交通事故' },
              { key: 'weapon', label: '③ 銃創・刺創' },
              { key: 'amputation', label: '④ 四肢切断' },
              { key: 'trapped', label: '⑤ 要救助の挟まり' },
              { key: 'burn', label: '⑥ 重度熱傷' },
              { key: 'multiple', label: '⑦ 多数傷者発生' }
            ].map((item) => (
              <label key={item.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={registry.dispatchCriteria?.category3?.[item.key as keyof typeof registry.dispatchCriteria.category3] || false}
                  onChange={(e) => setRegistry({
                    ...registry,
                    dispatchCriteria: {
                      ...registry.dispatchCriteria!,
                      category3: {
                        ...registry.dispatchCriteria?.category3!,
                        [item.key]: e.target.checked
                      }
                    }
                  })}
                  className="mr-2"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        {/* Category IV */}
        <div className="mb-4">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={registry.dispatchCriteria?.category4?.selected || false}
              onChange={(e) => setRegistry({
                ...registry,
                dispatchCriteria: {
                  ...registry.dispatchCriteria!,
                  category4: {
                    ...registry.dispatchCriteria?.category4!,
                    selected: e.target.checked
                  }
                }
              })}
              className="mr-2"
            />
            <span className="font-medium">IV 内因によるもの</span>
          </label>
          <div className="ml-6 space-y-2">
            {[
              { key: 'stroke', label: '① 脳卒中疑い・意識障害' },
              { key: 'cardiac', label: '② 心疾患疑い' },
              { key: 'other', label: '③ その他' }
            ].map((item) => (
              <label key={item.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={registry.dispatchCriteria?.category4?.[item.key as keyof typeof registry.dispatchCriteria.category4] || false}
                  onChange={(e) => setRegistry({
                    ...registry,
                    dispatchCriteria: {
                      ...registry.dispatchCriteria!,
                      category4: {
                        ...registry.dispatchCriteria?.category4!,
                        [item.key]: e.target.checked
                      }
                    }
                  })}
                  className="mr-2"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        {/* Category V */}
        <div className="mb-4">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={registry.dispatchCriteria?.category5?.selected || false}
              onChange={(e) => setRegistry({
                ...registry,
                dispatchCriteria: {
                  ...registry.dispatchCriteria!,
                  category5: {
                    ...registry.dispatchCriteria?.category5!,
                    selected: e.target.checked
                  }
                }
              })}
              className="mr-2"
            />
            <span className="font-medium">V その他</span>
          </label>
          <div className="ml-6 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={registry.dispatchCriteria?.category5?.fireCommand || false}
                onChange={(e) => setRegistry({
                  ...registry,
                  dispatchCriteria: {
                    ...registry.dispatchCriteria!,
                    category5: {
                      ...registry.dispatchCriteria?.category5!,
                      fireCommand: e.target.checked
                    }
                  }
                })}
                className="mr-2"
              />
              ① 警防本部が効果的と判断したもの
            </label>
          </div>
        </div>

        {/* Category VI */}
        <div className="mb-4">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={registry.dispatchCriteria?.category6?.selected || false}
              onChange={(e) => setRegistry({
                ...registry,
                dispatchCriteria: {
                  ...registry.dispatchCriteria!,
                  category6: {
                    ...registry.dispatchCriteria?.category6!,
                    selected: e.target.checked
                  }
                }
              })}
              className="mr-2"
            />
            <span className="font-medium">VI DMAT</span>
          </label>
          <div className="ml-6 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={registry.dispatchCriteria?.category6?.paramedic || false}
                onChange={(e) => setRegistry({
                  ...registry,
                  dispatchCriteria: {
                    ...registry.dispatchCriteria!,
                    category6: {
                      ...registry.dispatchCriteria?.category6!,
                      paramedic: e.target.checked
                    }
                  }
                })}
                className="mr-2"
              />
              ② 救急隊現着時救急隊長が効果的と判断したもの
            </label>
          </div>
        </div>
      </div>

      {/* 発症前のADL */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">発症前のADL</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { value: 'independent', label: '自立' },
            { value: 'care-required', label: '要介護' },
            { value: 'unknown', label: '不明' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="preOnsetADL"
                value={option.value}
                checked={registry.preOnsetADL === option.value}
                onChange={(e) => setRegistry({ ...registry, preOnsetADL: e.target.value as any })}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* 現場へのアクセス */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">現場へのアクセス</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { value: 'easy', label: '容易（車を降りて直ぐ）' },
            { value: 'rescue-needed', label: 'レスキュー隊が必要' },
            { value: 'difficult', label: '困難で有るがレスキュー隊は不要' },
            { value: 'unknown', label: '不明' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="sceneAccess"
                value={option.value}
                checked={registry.sceneAccess === option.value}
                onChange={(e) => setRegistry({ ...registry, sceneAccess: e.target.value as any })}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* PA連携 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">PA連携（ポンプ隊と救急隊の連携）の有無</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="paCooperation"
              value="present"
              checked={registry.paCooperation?.present === true}
              onChange={() => setRegistry({
                ...registry,
                paCooperation: { ...registry.paCooperation!, present: true }
              })}
              className="mr-2"
            />
            有
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="paCooperation"
              value="absent"
              checked={registry.paCooperation?.present === false}
              onChange={() => setRegistry({
                ...registry,
                paCooperation: { ...registry.paCooperation!, present: false }
              })}
              className="mr-2"
            />
            無
          </label>
        </div>
        {registry.paCooperation?.present && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ポンプ隊現着時間
            </label>
            <Input
              type="datetime-local"
              value={registry.paCooperation?.pumpArrivalTime || ''}
              onChange={(e) => setRegistry({
                ...registry,
                paCooperation: {
                  ...registry.paCooperation!,
                  pumpArrivalTime: e.target.value
                }
              })}
            />
          </div>
        )}
      </div>

      {/* 出動番地 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">出動番地</h3>
        <Input
          type="text"
          value={registry.dispatchVehicle || ''}
          onChange={(e) => setRegistry({ ...registry, dispatchVehicle: e.target.value })}
          placeholder="出動番地を入力してください"
        />
      </div>

      {/* 発生場所 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">発生場所</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {[
            { value: 'home-house', label: '自宅（戸建）' },
            { value: 'home-apartment-low', label: '自宅（共同住宅10F以下）' },
            { value: 'home-apartment-high', label: '自宅（共同住宅11F以上）' },
            { value: 'station', label: '駅' },
            { value: 'commercial', label: '商業施設' },
            { value: 'office', label: 'オフィス' },
            { value: 'factory', label: '工場' },
            { value: 'road', label: '路上' },
            { value: 'school', label: '学校' },
            { value: 'other', label: 'その他' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="locationType"
                value={option.value}
                checked={registry.location?.type === option.value}
                onChange={(e) => setRegistry({
                  ...registry,
                  location: { ...registry.location!, type: e.target.value as any }
                })}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            発生場所—その他詳細
          </label>
          <Input
            type="text"
            value={registry.location?.details || ''}
            onChange={(e) => setRegistry({
              ...registry,
              location: { ...registry.location!, details: e.target.value }
            })}
          />
        </div>
      </div>
    </div>
  );
};

// 時間経過・バイタルタブ
const TimelineTab: React.FC<{
  registry: Partial<DoctorCarRegistry>;
  setRegistry: React.Dispatch<React.SetStateAction<Partial<DoctorCarRegistry>>>;
}> = ({ registry, setRegistry }) => {
  // 今日の日付をデフォルト値として使用
  const getDefaultDateTime = (timeOffset: number = 0): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + timeOffset);
    return now.toISOString().slice(0, 16);
  };

  // 既存の値があればそれを使用、なければデフォルト値を設定
  const getTimelineValue = (timeline: any, key: string, defaultOffset: number = 0): string => {
    if (timeline?.[key]) {
      try {
        const date = timeline[key].toDate ? timeline[key].toDate() : new Date(timeline[key]);
        return date.toISOString().slice(0, 16);
      } catch {
        return getDefaultDateTime(defaultOffset);
      }
    }
    return getDefaultDateTime(defaultOffset);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">時間経過</h3>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 デフォルトで本日の日付が設定されています。必要に応じて日時を修正してください。
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">項目</th>
                <th className="border border-gray-300 px-4 py-2 text-left">救急隊</th>
                <th className="border border-gray-300 px-4 py-2 text-left">ドクターカー</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'awareness', label: '覚知日時', defaultOffset: 0 },
                { key: 'arrival', label: '現着日時', defaultOffset: 10 },
                { key: 'contact', label: '接触日時', defaultOffset: 15 },
                { key: 'departure', label: '現発日時', defaultOffset: 45 },
                { key: 'hospitalArrival', label: '病着日時', defaultOffset: 60 }
              ].map((row) => (
                <tr key={row.key}>
                  <td className="border border-gray-300 px-4 py-2 font-medium">{row.label}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Input
                      type="datetime-local"
                      className="w-full"
                      value={getTimelineValue(registry.timelineEms, row.key, row.defaultOffset)}
                      onChange={(e) => setRegistry({
                        ...registry,
                        timelineEms: {
                          ...registry.timelineEms!,
                          [row.key]: new Date(e.target.value) as any
                        }
                      })}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Input
                      type="datetime-local"
                      className="w-full"
                      value={getTimelineValue(registry.timelineDoctorCar, row.key, row.defaultOffset + 5)}
                      onChange={(e) => setRegistry({
                        ...registry,
                        timelineDoctorCar: {
                          ...registry.timelineDoctorCar!,
                          [row.key]: new Date(e.target.value) as any
                        }
                      })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 活動時間の自動計算表示 */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">活動時間（自動計算）</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-gray-600">総活動時間（覚知から病院収容まで）</label>
              <Input
                type="number"
                value={registry.totalActivityTime || ''}
                onChange={(e) => setRegistry({ ...registry, totalActivityTime: parseInt(e.target.value) })}
                placeholder="分"
              />
            </div>
            <div>
              <label className="block text-gray-600">医師接触までの時間</label>
              <Input
                type="number"
                value={registry.doctorContactTime || ''}
                onChange={(e) => setRegistry({ ...registry, doctorContactTime: parseInt(e.target.value) })}
                placeholder="分"
              />
            </div>
            <div>
              <label className="block text-gray-600">現場活動時間</label>
              <Input
                type="number"
                value={registry.sceneActivityTime || ''}
                onChange={(e) => setRegistry({ ...registry, sceneActivityTime: parseInt(e.target.value) })}
                placeholder="分"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 患者バイタル */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">患者バイタル</h3>
        
        {/* GCS */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">GCS（Glasgow Coma Scale）</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GCS 合計
              </label>
              <Input
                type="number"
                min="3"
                max="15"
                value={registry.vitals?.gcs?.total || ''}
                onChange={(e) => setRegistry({
                  ...registry,
                  vitals: {
                    ...registry.vitals!,
                    gcs: { ...registry.vitals?.gcs!, total: parseInt(e.target.value) || 0 }
                  }
                })}
                placeholder="3-15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E（開眼）
              </label>
              <Input
                type="number"
                min="1"
                max="4"
                value={registry.vitals?.gcs?.eye || ''}
                onChange={(e) => setRegistry({
                  ...registry,
                  vitals: {
                    ...registry.vitals!,
                    gcs: { ...registry.vitals?.gcs!, eye: parseInt(e.target.value) || 0 }
                  }
                })}
                placeholder="1-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                V（言語）
              </label>
              <Input
                type="number"
                min="1"
                max="5"
                value={registry.vitals?.gcs?.verbal || ''}
                onChange={(e) => setRegistry({
                  ...registry,
                  vitals: {
                    ...registry.vitals!,
                    gcs: { ...registry.vitals?.gcs!, verbal: parseInt(e.target.value) || 0 }
                  }
                })}
                placeholder="1-5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                M（運動）
              </label>
              <Input
                type="number"
                min="1"
                max="6"
                value={registry.vitals?.gcs?.motor || ''}
                onChange={(e) => setRegistry({
                  ...registry,
                  vitals: {
                    ...registry.vitals!,
                    gcs: { ...registry.vitals?.gcs!, motor: parseInt(e.target.value) || 0 }
                  }
                })}
                placeholder="1-6"
              />
            </div>
          </div>
        </div>

        {/* バイタルサイン */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">バイタルサイン</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                血圧（収縮期/拡張期）
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={registry.vitals?.bloodPressure?.systolic || ''}
                  onChange={(e) => setRegistry({
                    ...registry,
                    vitals: {
                      ...registry.vitals!,
                      bloodPressure: { ...registry.vitals?.bloodPressure!, systolic: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="収縮期"
                />
                <span className="text-gray-500">/</span>
                <Input
                  type="number"
                  value={registry.vitals?.bloodPressure?.diastolic || ''}
                  onChange={(e) => setRegistry({
                    ...registry,
                    vitals: {
                      ...registry.vitals!,
                      bloodPressure: { ...registry.vitals?.bloodPressure!, diastolic: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="拡張期"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                脈拍（回/分）
              </label>
              <Input
                type="number"
                value={registry.vitals?.pulse || ''}
                onChange={(e) => setRegistry({
                  ...registry,
                  vitals: {
                    ...registry.vitals!,
                    pulse: parseInt(e.target.value) || 0
                  }
                })}
                placeholder="例：80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                呼吸（回/分）
              </label>
              <Input
                type="number"
                value={registry.vitals?.respiration || ''}
                onChange={(e) => setRegistry({
                  ...registry,
                  vitals: {
                    ...registry.vitals!,
                    respiration: parseInt(e.target.value) || 0
                  }
                })}
                placeholder="例：20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                体温（℃）
              </label>
              <Input
                type="number"
                step="0.1"
                value={registry.vitals?.temperature || ''}
                onChange={(e) => setRegistry({
                  ...registry,
                  vitals: {
                    ...registry.vitals!,
                    temperature: parseFloat(e.target.value) || 0
                  }
                })}
                placeholder="例：36.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SpO2（%）
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={registry.vitals?.spo2 || ''}
                onChange={(e) => setRegistry({
                  ...registry,
                  vitals: {
                    ...registry.vitals!,
                    spo2: parseInt(e.target.value) || 0
                  }
                })}
                placeholder="例：98"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                酸素（L/分）
              </label>
              <Input
                type="number"
                step="0.1"
                value={registry.vitals?.oxygen || ''}
                onChange={(e) => setRegistry({
                  ...registry,
                  vitals: {
                    ...registry.vitals!,
                    oxygen: parseFloat(e.target.value) || 0
                  }
                })}
                placeholder="例：2.0"
              />
            </div>
          </div>
        </div>

        {/* 神経学的所見 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">神経学的所見</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                瞳孔（右, 左）mm
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={registry.vitals?.pupil?.split(',')[0]?.trim() || ''}
                  onChange={(e) => {
                    const current = registry.vitals?.pupil?.split(',') || ['', ''];
                    const newValue = [e.target.value, current[1]?.trim() || ''].join(', ');
                    setRegistry({
                      ...registry,
                      vitals: {
                        ...registry.vitals!,
                        pupil: newValue
                      }
                    });
                  }}
                  placeholder="右瞳孔"
                />
                <span className="text-gray-500">,</span>
                <Input
                  type="text"
                  value={registry.vitals?.pupil?.split(',')[1]?.trim() || ''}
                  onChange={(e) => {
                    const current = registry.vitals?.pupil?.split(',') || ['', ''];
                    const newValue = [current[0]?.trim() || '', e.target.value].join(', ');
                    setRegistry({
                      ...registry,
                      vitals: {
                        ...registry.vitals!,
                        pupil: newValue
                      }
                    });
                  }}
                  placeholder="左瞳孔"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                対光反射（右, 左）
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={registry.vitals?.lightReflex?.split(',')[0]?.trim() || ''}
                  onChange={(e) => {
                    const current = registry.vitals?.lightReflex?.split(',') || ['', ''];
                    const newValue = [e.target.value, current[1]?.trim() || ''].join(', ');
                    setRegistry({
                      ...registry,
                      vitals: {
                        ...registry.vitals!,
                        lightReflex: newValue
                      }
                    });
                  }}
                  placeholder="右反射"
                />
                <span className="text-gray-500">,</span>
                <Input
                  type="text"
                  value={registry.vitals?.lightReflex?.split(',')[1]?.trim() || ''}
                  onChange={(e) => {
                    const current = registry.vitals?.lightReflex?.split(',') || ['', ''];
                    const newValue = [current[0]?.trim() || '', e.target.value].join(', ');
                    setRegistry({
                      ...registry,
                      vitals: {
                        ...registry.vitals!,
                        lightReflex: newValue
                      }
                    });
                  }}
                  placeholder="左反射"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 搬送先・分類タブ
const VitalsDestinationTab: React.FC<{
  registry: Partial<DoctorCarRegistry>;
  setRegistry: React.Dispatch<React.SetStateAction<Partial<DoctorCarRegistry>>>;
}> = ({ registry, setRegistry }) => (
  <div className="space-y-8">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">搬送先</h3>
      <div className="space-y-4">
        {[
          { value: 'own-tertiary', label: '自院三次' },
          { value: 'own-secondary', label: '自院二次' },
          { value: 'other-tertiary', label: '他院三次' },
          { value: 'other-secondary', label: '他院二次' },
          { value: 'cancel-before-arrival', label: '現着前にキャンセル' },
          { value: 'cancel-mild', label: '現着後に軽症の為キャンセル' },
          { value: 'social-death', label: '社会死（死亡確認）' },
          { value: 'other', label: 'その他' }
        ].map((option) => (
          <div key={option.value}>
            <label className="flex items-center">
              <input
                type="radio"
                name="destinationType"
                value={option.value}
                checked={registry.destination?.type === option.value}
                onChange={(e) => setRegistry({
                  ...registry,
                  destination: { ...registry.destination!, type: e.target.value as any }
                })}
                className="mr-2"
              />
              {option.label}
            </label>
            
            {/* 現着前キャンセルの理由入力 */}
            {registry.destination?.type === 'cancel-before-arrival' && option.value === 'cancel-before-arrival' && (
              <div className="ml-6 mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  キャンセル理由
                </label>
                <Input
                  type="text"
                  value={registry.destination?.cancelReason || ''}
                  onChange={(e) => setRegistry({
                    ...registry,
                    destination: {
                      ...registry.destination!,
                      cancelReason: e.target.value
                    }
                  })}
                  placeholder="キャンセル理由を入力してください"
                />
              </div>
            )}
            
            {/* 社会死の貢献度判定 */}
            {registry.destination?.type === 'social-death' && option.value === 'social-death' && (
              <div className="ml-6 mt-2 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    社会死の判断は不要な搬送を減らすことに貢献したか
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="socialDeathHelpful"
                        value="true"
                        checked={registry.destination?.socialDeathContribution?.helpful === true}
                        onChange={() => setRegistry({
                          ...registry,
                          destination: {
                            ...registry.destination!,
                            socialDeathContribution: {
                              ...registry.destination?.socialDeathContribution!,
                              helpful: true
                            }
                          }
                        })}
                        className="mr-1"
                      />
                      はい
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="socialDeathHelpful"
                        value="false"
                        checked={registry.destination?.socialDeathContribution?.helpful === false}
                        onChange={() => setRegistry({
                          ...registry,
                          destination: {
                            ...registry.destination!,
                            socialDeathContribution: {
                              ...registry.destination?.socialDeathContribution!,
                              helpful: false
                            }
                          }
                        })}
                        className="mr-1"
                      />
                      いいえ
                    </label>
                  </div>
                </div>
                
                {/* 「はい」を選択した場合の理由選択 */}
                {registry.destination?.socialDeathContribution?.helpful === true && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      選択理由
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={registry.destination?.socialDeathContribution?.reasons?.emsJudgment || false}
                          onChange={(e) => setRegistry({
                            ...registry,
                            destination: {
                              ...registry.destination!,
                              socialDeathContribution: {
                                ...registry.destination?.socialDeathContribution!,
                                reasons: {
                                  ...registry.destination?.socialDeathContribution?.reasons!,
                                  emsJudgment: e.target.checked
                                }
                              }
                            }
                          })}
                          className="mr-2"
                        />
                        救急隊の判断に寄与
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={registry.destination?.socialDeathContribution?.reasons?.familyAcceptance || false}
                          onChange={(e) => setRegistry({
                            ...registry,
                            destination: {
                              ...registry.destination!,
                              socialDeathContribution: {
                                ...registry.destination?.socialDeathContribution!,
                                reasons: {
                                  ...registry.destination?.socialDeathContribution?.reasons!,
                                  familyAcceptance: e.target.checked
                                }
                              }
                            }
                          })}
                          className="mr-2"
                        />
                        家族が納得
                      </label>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={registry.destination?.socialDeathContribution?.reasons?.other || false}
                            onChange={(e) => setRegistry({
                              ...registry,
                              destination: {
                                ...registry.destination!,
                                socialDeathContribution: {
                                  ...registry.destination?.socialDeathContribution!,
                                  reasons: {
                                    ...registry.destination?.socialDeathContribution?.reasons!,
                                    other: e.target.checked
                                  }
                                }
                              }
                            })}
                            className="mr-2"
                          />
                          その他
                        </label>
                        {registry.destination?.socialDeathContribution?.reasons?.other && (
                          <div className="ml-6 mt-1">
                            <Input
                              type="text"
                              value={registry.destination?.socialDeathContribution?.reasons?.otherReason || ''}
                              onChange={(e) => setRegistry({
                                ...registry,
                                destination: {
                                  ...registry.destination!,
                                  socialDeathContribution: {
                                    ...registry.destination?.socialDeathContribution!,
                                    reasons: {
                                      ...registry.destination?.socialDeathContribution?.reasons!,
                                      otherReason: e.target.value
                                    }
                                  }
                                }
                              })}
                              placeholder="その他の理由を入力してください"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">該当分類</h3>
      <div className="flex space-x-6">
        {['C', 'T', 'S', 'M'].map((cat) => (
          <label key={cat} className="flex items-center">
            <input
              type="radio"
              name="category"
              value={cat}
              checked={registry.category === cat}
              onChange={(e) => setRegistry({ ...registry, category: e.target.value as any })}
              className="mr-2"
            />
            {cat}
          </label>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">推定病名</h3>
      <textarea
        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
        rows={3}
        value={registry.estimatedDiagnosis?.join('\n') || ''}
        onChange={(e) => setRegistry({
          ...registry,
          estimatedDiagnosis: e.target.value.split('\n').filter(line => line.trim())
        })}
        placeholder="推定病名を入力してください（複数行可）"
      />
    </div>
  </div>
);

// 分類別詳細タブ
const CategoryTab: React.FC<{
  registry: Partial<DoctorCarRegistry>;
  setRegistry: React.Dispatch<React.SetStateAction<Partial<DoctorCarRegistry>>>;
}> = ({ registry, setRegistry }) => {
  const [activeSubTab, setActiveSubTab] = useState<'C' | 'T' | 'S' | 'M'>('C');

  return (
    <div className="space-y-6">
      {/* サブタブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'C', label: 'II-C 心停止' },
            { key: 'T', label: 'II-T 外傷' },
            { key: 'S', label: 'II-S 脳卒中' },
            { key: 'M', label: 'II-M ACS' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* サブタブコンテンツ */}
      <div>
        {activeSubTab === 'C' && (
          <CardiacArrestTab registry={registry} setRegistry={setRegistry} />
        )}
        {activeSubTab === 'T' && (
          <TraumaTab registry={registry} setRegistry={setRegistry} />
        )}
        {activeSubTab === 'S' && (
          <StrokeTab registry={registry} setRegistry={setRegistry} />
        )}
        {activeSubTab === 'M' && (
          <AcsTab registry={registry} setRegistry={setRegistry} />
        )}
      </div>
    </div>
  );
};

// II-C: 心停止関連データ
const CardiacArrestTab: React.FC<{
  registry: Partial<DoctorCarRegistry>;
  setRegistry: React.Dispatch<React.SetStateAction<Partial<DoctorCarRegistry>>>;
}> = ({ registry, setRegistry }) => (
  <div className="space-y-8">
    {/* 目撃者・バイスタンダーCPR */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">目撃者・バイスタンダーCPR</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">目撃者</label>
          <div className="space-y-2">
            {[
              { value: 'present', label: 'あり' },
              { value: 'absent', label: 'なし' },
              { value: 'unknown', label: '不明' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="witness"
                  value={option.value}
                  checked={registry.cardiacArrest?.witness === option.value}
                  onChange={(e) => setRegistry({
                    ...registry,
                    cardiacArrest: {
                      ...registry.cardiacArrest!,
                      witness: e.target.value as any
                    }
                  })}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">バイスタンダーCPR</label>
          <div className="space-y-2">
            {[
              { value: 'present', label: 'あり' },
              { value: 'absent', label: 'なし' },
              { value: 'unknown', label: '不明' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="bystanderCPR"
                  value={option.value}
                  checked={registry.cardiacArrest?.bystanderCPR?.performed === option.value}
                  onChange={(e) => setRegistry({
                    ...registry,
                    cardiacArrest: {
                      ...registry.cardiacArrest!,
                      bystanderCPR: {
                        ...registry.cardiacArrest?.bystanderCPR!,
                        performed: e.target.value as any
                      }
                    }
                  })}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
          
          {/* バイスタンダーCPR詳細 */}
          {registry.cardiacArrest?.bystanderCPR?.performed === 'present' && (
            <div className="mt-3 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={registry.cardiacArrest?.bystanderCPR?.chestCompression || false}
                  onChange={(e) => setRegistry({
                    ...registry,
                    cardiacArrest: {
                      ...registry.cardiacArrest!,
                      bystanderCPR: {
                        ...registry.cardiacArrest?.bystanderCPR!,
                        chestCompression: e.target.checked
                      }
                    }
                  })}
                  className="mr-2"
                />
                胸骨圧迫
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={registry.cardiacArrest?.bystanderCPR?.artificialRespiration || false}
                  onChange={(e) => setRegistry({
                    ...registry,
                    cardiacArrest: {
                      ...registry.cardiacArrest!,
                      bystanderCPR: {
                        ...registry.cardiacArrest?.bystanderCPR!,
                        artificialRespiration: e.target.checked
                      }
                    }
                  })}
                  className="mr-2"
                />
                人工呼吸
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={registry.cardiacArrest?.bystanderCPR?.aed || false}
                  onChange={(e) => setRegistry({
                    ...registry,
                    cardiacArrest: {
                      ...registry.cardiacArrest!,
                      bystanderCPR: {
                        ...registry.cardiacArrest?.bystanderCPR!,
                        aed: e.target.checked
                      }
                    }
                  })}
                  className="mr-2"
                />
                AED使用
              </label>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">消防指導</label>
          <div className="space-y-2">
            {[
              { value: 'present', label: 'あり' },
              { value: 'absent', label: 'なし' },
              { value: 'unknown', label: '不明' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="fireGuidance"
                  value={option.value}
                  checked={registry.cardiacArrest?.fireGuidance === option.value}
                  onChange={(e) => setRegistry({
                    ...registry,
                    cardiacArrest: {
                      ...registry.cardiacArrest!,
                      fireGuidance: e.target.value as any
                    }
                  })}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* 初期心電図波形・推定心停止時刻 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">初期心電図波形・時刻</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">初期心電図波形</label>
          <div className="space-y-2">
            {[
              { value: 'asystole', label: 'Asystole' },
              { value: 'pea', label: 'PEA' },
              { value: 'vf', label: 'VF' },
              { value: 'pulseless-vt', label: 'Pulseless VT' },
              { value: 'pulse-present', label: '脈拍触知可能' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="initialRhythm"
                  value={option.value}
                  checked={registry.cardiacArrest?.initialRhythm === option.value}
                  onChange={(e) => setRegistry({
                    ...registry,
                    cardiacArrest: {
                      ...registry.cardiacArrest!,
                      initialRhythm: e.target.value as any
                    }
                  })}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">推定心停止時刻</label>
          <Input
            type="time"
            value={registry.cardiacArrest?.estimatedArrestTime || ''}
            onChange={(e) => setRegistry({
              ...registry,
              cardiacArrest: {
                ...registry.cardiacArrest!,
                estimatedArrestTime: e.target.value
              }
            })}
          />
        </div>
      </div>
    </div>

    {/* ROSC・転帰 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">ROSC・転帰</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">搬送中ROSC</label>
          <div className="space-y-2">
            {[
              { value: 'present', label: 'あり' },
              { value: 'absent', label: 'なし' },
              { value: 'unknown', label: '不明' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="roscDuringTransport"
                  value={option.value}
                  checked={registry.cardiacArrest?.rosc?.duringTransport === option.value}
                  onChange={(e) => setRegistry({
                    ...registry,
                    cardiacArrest: {
                      ...registry.cardiacArrest!,
                      rosc: {
                        ...registry.cardiacArrest?.rosc!,
                        duringTransport: e.target.value as any
                      }
                    }
                  })}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">入院</label>
          <div className="space-y-2">
            {[
              { value: 'er-death', label: 'ER死亡' },
              { value: 'admission', label: '入院' },
              { value: 'transfer', label: '転院' },
              { value: 'unknown', label: '不明' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="hospitalization"
                  value={option.value}
                  checked={registry.cardiacArrest?.hospitalization === option.value}
                  onChange={(e) => setRegistry({
                    ...registry,
                    cardiacArrest: {
                      ...registry.cardiacArrest!,
                      hospitalization: e.target.value as any
                    }
                  })}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// II-T: 外傷関連データ
const TraumaTab: React.FC<{
  registry: Partial<DoctorCarRegistry>;
  setRegistry: React.Dispatch<React.SetStateAction<Partial<DoctorCarRegistry>>>;
}> = ({ registry, setRegistry }) => (
  <div className="space-y-8">
    {/* 受傷機転 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">受傷機転</h3>
      <div className="space-y-2">
        {[
          { value: 'blunt', label: '鈍的外傷' },
          { value: 'penetrating', label: '穿通性外傷' },
          { value: 'burn', label: '熱傷' }
        ].map((option) => (
          <label key={option.value} className="flex items-center">
            <input
              type="radio"
              name="traumaMechanism"
              value={option.value}
              checked={registry.trauma?.mechanism === option.value}
              onChange={(e) => setRegistry({
                ...registry,
                trauma: {
                  ...registry.trauma!,
                  mechanism: e.target.value as any
                }
              })}
              className="mr-2"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>

    {/* 現場処置 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">現場処置</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { key: 'oxygenTherapy', label: '酸素療法' },
          { key: 'intubation', label: '気管挿管' },
          { key: 'thoracentesis', label: '胸腔穿刺' }
        ].map((field) => (
          <label key={field.key} className="flex items-center">
            <input
              type="checkbox"
              checked={registry.trauma?.fieldTreatment?.[field.key as keyof typeof registry.trauma.fieldTreatment] || false}
              onChange={(e) => setRegistry({
                ...registry,
                trauma: {
                  ...registry.trauma!,
                  fieldTreatment: {
                    ...registry.trauma?.fieldTreatment!,
                    [field.key]: e.target.checked
                  }
                }
              })}
              className="mr-2"
            />
            {field.label}
          </label>
        ))}
      </div>
    </div>

    {/* AIS・ISS・重症度スコア */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">重症度スコア</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ISS</label>
          <Input
            type="number"
            min="0"
            max="75"
            value={registry.trauma?.iss || ''}
            onChange={(e) => setRegistry({
              ...registry,
              trauma: {
                ...registry.trauma!,
                iss: parseInt(e.target.value) || 0
              }
            })}
            placeholder="0-75"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">RTS</label>
          <Input
            type="number"
            min="0"
            max="12"
            step="0.1"
            value={registry.trauma?.rts || ''}
            onChange={(e) => setRegistry({
              ...registry,
              trauma: {
                ...registry.trauma!,
                rts: parseFloat(e.target.value) || 0
              }
            })}
            placeholder="0-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ps</label>
          <Input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={registry.trauma?.ps || ''}
            onChange={(e) => setRegistry({
              ...registry,
              trauma: {
                ...registry.trauma!,
                ps: parseFloat(e.target.value) || 0
              }
            })}
            placeholder="0-1"
          />
        </div>
      </div>
    </div>
  </div>
);

// II-S: 脳卒中関連データ
const StrokeTab: React.FC<{
  registry: Partial<DoctorCarRegistry>;
  setRegistry: React.Dispatch<React.SetStateAction<Partial<DoctorCarRegistry>>>;
}> = ({ registry, setRegistry }) => (
  <div className="space-y-8">
    {/* 疑われた病態 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">疑われた病態</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { key: 'infarction', label: '脳梗塞' },
          { key: 'hemorrhage', label: '脳出血' },
          { key: 'sah', label: 'くも膜下出血' },
          { key: 'tia', label: 'TIA' },
          { key: 'seizure', label: 'けいれん' },
          { key: 'hypoglycemia', label: '低血糖' },
          { key: 'metabolic', label: '代謝性疾患' },
          { key: 'alcohol', label: 'アルコール' },
          { key: 'poisoning', label: '中毒' },
          { key: 'other', label: 'その他' }
        ].map((condition) => (
          <label key={condition.key} className="flex items-center">
            <input
              type="checkbox"
              checked={registry.stroke?.suspectedCondition?.[condition.key as keyof typeof registry.stroke.suspectedCondition] || false}
              onChange={(e) => setRegistry({
                ...registry,
                stroke: {
                  ...registry.stroke!,
                  suspectedCondition: {
                    ...registry.stroke?.suspectedCondition!,
                    [condition.key]: e.target.checked
                  }
                }
              })}
              className="mr-2"
            />
            {condition.label}
          </label>
        ))}
      </div>
    </div>

    {/* 時間経過 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">時間経過</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">発症時刻</label>
          <Input
            type="time"
            value={registry.stroke?.onsetTime || ''}
            onChange={(e) => setRegistry({
              ...registry,
              stroke: {
                ...registry.stroke!,
                onsetTime: e.target.value
              }
            })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">最終健常確認時刻</label>
          <Input
            type="time"
            value={registry.stroke?.lastSeenNormalTime || ''}
            onChange={(e) => setRegistry({
              ...registry,
              stroke: {
                ...registry.stroke!,
                lastSeenNormalTime: e.target.value
              }
            })}
          />
        </div>
      </div>
    </div>

    {/* CPSS・KPSS */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">神経学的評価</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">CPSS</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={registry.stroke?.cpss?.facialDrooping || false}
                onChange={(e) => setRegistry({
                  ...registry,
                  stroke: {
                    ...registry.stroke!,
                    cpss: {
                      ...registry.stroke?.cpss!,
                      facialDrooping: e.target.checked
                    }
                  }
                })}
                className="mr-2"
              />
              顔面下垂
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={registry.stroke?.cpss?.armWeakness || false}
                onChange={(e) => setRegistry({
                  ...registry,
                  stroke: {
                    ...registry.stroke!,
                    cpss: {
                      ...registry.stroke?.cpss!,
                      armWeakness: e.target.checked
                    }
                  }
                })}
                className="mr-2"
              />
              上肢脱力
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={registry.stroke?.cpss?.speech || false}
                onChange={(e) => setRegistry({
                  ...registry,
                  stroke: {
                    ...registry.stroke!,
                    cpss: {
                      ...registry.stroke?.cpss!,
                      speech: e.target.checked
                    }
                  }
                })}
                className="mr-2"
              />
              構語障害
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">KPSS合計点</h4>
          <Input
            type="number"
            min="0"
            max="22"
            value={registry.stroke?.kpss?.total || ''}
            onChange={(e) => setRegistry({
              ...registry,
              stroke: {
                ...registry.stroke!,
                kpss: {
                  ...registry.stroke?.kpss!,
                  total: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="0-22"
          />
        </div>
      </div>
    </div>
  </div>
);

// II-M: ACS関連データ
const AcsTab: React.FC<{
  registry: Partial<DoctorCarRegistry>;
  setRegistry: React.Dispatch<React.SetStateAction<Partial<DoctorCarRegistry>>>;
}> = ({ registry, setRegistry }) => (
  <div className="space-y-8">
    {/* 既往歴 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">既往歴</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { key: 'hypertension', label: '高血圧' },
          { key: 'diabetes', label: '糖尿病' },
          { key: 'hyperlipidemia', label: '脂質異常症' },
          { key: 'smoking', label: '喫煙' },
          { key: 'familyHistory', label: '家族歴' },
          { key: 'heartDisease', label: '心疾患' },
          { key: 'respiratoryDisease', label: '呼吸器疾患' }
        ].map((history) => (
          <label key={history.key} className="flex items-center">
            <input
              type="checkbox"
              checked={registry.acs?.medicalHistory?.[history.key as keyof typeof registry.acs.medicalHistory] || false}
              onChange={(e) => setRegistry({
                ...registry,
                acs: {
                  ...registry.acs!,
                  medicalHistory: {
                    ...registry.acs?.medicalHistory!,
                    [history.key]: e.target.checked
                  }
                }
              })}
              className="mr-2"
            />
            {history.label}
          </label>
        ))}
      </div>
    </div>

    {/* 病院外12誘導心電図所見 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">病院外12誘導心電図所見</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">心調律</label>
          <div className="space-y-2">
            {[
              { value: 'sinus', label: '洞調律' },
              { value: 'af', label: '心房細動' },
              { value: 'junctional', label: '接合部調律' },
              { value: 'other', label: 'その他' },
              { value: 'unknown', label: '不明' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="ecgRhythm"
                  value={option.value}
                  checked={registry.acs?.prehospitalFindings?.ecgFindings?.rhythm === option.value}
                  onChange={(e) => setRegistry({
                    ...registry,
                    acs: {
                      ...registry.acs!,
                      prehospitalFindings: {
                        ...registry.acs?.prehospitalFindings!,
                        ecgFindings: {
                          ...registry.acs?.prehospitalFindings?.ecgFindings!,
                          rhythm: e.target.value as any
                        }
                      }
                    }
                  })}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">心拍数</label>
          <Input
            type="number"
            min="0"
            max="300"
            value={registry.acs?.prehospitalFindings?.ecgFindings?.heartRate || ''}
            onChange={(e) => setRegistry({
              ...registry,
              acs: {
                ...registry.acs!,
                prehospitalFindings: {
                  ...registry.acs?.prehospitalFindings!,
                  ecgFindings: {
                    ...registry.acs?.prehospitalFindings?.ecgFindings!,
                    heartRate: parseInt(e.target.value) || 0
                  }
                }
              }
            })}
            placeholder="回/分"
          />
        </div>
      </div>

      {/* ST変化 */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">ST変化</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={registry.acs?.prehospitalFindings?.ecgFindings?.stChanges?.elevation || false}
              onChange={(e) => setRegistry({
                ...registry,
                acs: {
                  ...registry.acs!,
                  prehospitalFindings: {
                    ...registry.acs?.prehospitalFindings!,
                    ecgFindings: {
                      ...registry.acs?.prehospitalFindings?.ecgFindings!,
                      stChanges: {
                        ...registry.acs?.prehospitalFindings?.ecgFindings?.stChanges!,
                        elevation: e.target.checked
                      }
                    }
                  }
                }
              })}
              className="mr-2"
            />
            ST上昇
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={registry.acs?.prehospitalFindings?.ecgFindings?.stChanges?.depression || false}
              onChange={(e) => setRegistry({
                ...registry,
                acs: {
                  ...registry.acs!,
                  prehospitalFindings: {
                    ...registry.acs?.prehospitalFindings!,
                    ecgFindings: {
                      ...registry.acs?.prehospitalFindings?.ecgFindings!,
                      stChanges: {
                        ...registry.acs?.prehospitalFindings?.ecgFindings?.stChanges!,
                        depression: e.target.checked
                      }
                    }
                  }
                }
              })}
              className="mr-2"
            />
            ST低下
          </label>
        </div>
      </div>
    </div>

    {/* 疑われた病態・病院診断 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">疑われた病態・病院診断</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">疑われた病態</h4>
          <div className="space-y-2">
            {[
              { key: 'ami', label: '急性心筋梗塞' },
              { key: 'angina', label: '狭心症' },
              { key: 'arrhythmia', label: '不整脈' },
              { key: 'otherAcs', label: 'その他ACS' },
              { key: 'aorticDissection', label: '大動脈解離' },
              { key: 'acuteHeartFailure', label: '急性心不全' },
              { key: 'other', label: 'その他' }
            ].map((condition) => (
              <label key={condition.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={registry.acs?.suspectedCondition?.[condition.key as keyof typeof registry.acs.suspectedCondition] || false}
                  onChange={(e) => setRegistry({
                    ...registry,
                    acs: {
                      ...registry.acs!,
                      suspectedCondition: {
                        ...registry.acs?.suspectedCondition!,
                        [condition.key]: e.target.checked
                      }
                    }
                  })}
                  className="mr-2"
                />
                {condition.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">病院診断</h4>
          <div className="space-y-2">
            {[
              { key: 'ami', label: '急性心筋梗塞' },
              { key: 'angina', label: '狭心症' },
              { key: 'arrhythmia', label: '不整脈' },
              { key: 'otherAcs', label: 'その他ACS' },
              { key: 'aorticDissection', label: '大動脈解離' },
              { key: 'acuteHeartFailure', label: '急性心不全' },
              { key: 'other', label: 'その他' }
            ].map((condition) => (
              <label key={condition.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={registry.acs?.hospitalDiagnosis?.[condition.key as keyof typeof registry.acs.hospitalDiagnosis] || false}
                  onChange={(e) => setRegistry({
                    ...registry,
                    acs: {
                      ...registry.acs!,
                      hospitalDiagnosis: {
                        ...registry.acs?.hospitalDiagnosis!,
                        [condition.key]: e.target.checked
                      }
                    }
                  })}
                  className="mr-2"
                />
                {condition.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 院内経過タブ
const HospitalTab: React.FC<{
  registry: Partial<DoctorCarRegistry>;
  setRegistry: React.Dispatch<React.SetStateAction<Partial<DoctorCarRegistry>>>;
}> = ({ registry, setRegistry }) => (
  <div className="space-y-8">
    {/* 院内バイタルサイン */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">院内バイタルサイン</h3>
      
      {/* GCS */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">GCS（Glasgow Coma Scale）</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GCS 合計
            </label>
            <Input
              type="number"
              min="3"
              max="15"
              value={registry.hospitalCourse?.vitals?.gcs?.total || ''}
              onChange={(e) => setRegistry({
                ...registry,
                hospitalCourse: {
                  ...registry.hospitalCourse!,
                  vitals: {
                    ...registry.hospitalCourse?.vitals!,
                    gcs: { 
                      ...registry.hospitalCourse?.vitals?.gcs!, 
                      total: parseInt(e.target.value) || 0 
                    }
                  }
                }
              })}
              placeholder="3-15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E（開眼）
            </label>
            <Input
              type="number"
              min="1"
              max="4"
              value={registry.hospitalCourse?.vitals?.gcs?.eye || ''}
              onChange={(e) => setRegistry({
                ...registry,
                hospitalCourse: {
                  ...registry.hospitalCourse!,
                  vitals: {
                    ...registry.hospitalCourse?.vitals!,
                    gcs: { 
                      ...registry.hospitalCourse?.vitals?.gcs!, 
                      eye: parseInt(e.target.value) || 0 
                    }
                  }
                }
              })}
              placeholder="1-4"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              V（言語）
            </label>
            <Input
              type="number"
              min="1"
              max="5"
              value={registry.hospitalCourse?.vitals?.gcs?.verbal || ''}
              onChange={(e) => setRegistry({
                ...registry,
                hospitalCourse: {
                  ...registry.hospitalCourse!,
                  vitals: {
                    ...registry.hospitalCourse?.vitals!,
                    gcs: { 
                      ...registry.hospitalCourse?.vitals?.gcs!, 
                      verbal: parseInt(e.target.value) || 0 
                    }
                  }
                }
              })}
              placeholder="1-5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              M（運動）
            </label>
            <Input
              type="number"
              min="1"
              max="6"
              value={registry.hospitalCourse?.vitals?.gcs?.motor || ''}
              onChange={(e) => setRegistry({
                ...registry,
                hospitalCourse: {
                  ...registry.hospitalCourse!,
                  vitals: {
                    ...registry.hospitalCourse?.vitals!,
                    gcs: { 
                      ...registry.hospitalCourse?.vitals?.gcs!, 
                      motor: parseInt(e.target.value) || 0 
                    }
                  }
                }
              })}
              placeholder="1-6"
            />
          </div>
        </div>
      </div>

      {/* その他のバイタル */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">血圧</label>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={registry.hospitalCourse?.vitals?.bloodPressure?.systolic || ''}
              onChange={(e) => setRegistry({
                ...registry,
                hospitalCourse: {
                  ...registry.hospitalCourse!,
                  vitals: {
                    ...registry.hospitalCourse?.vitals!,
                    bloodPressure: {
                      ...registry.hospitalCourse?.vitals?.bloodPressure!,
                      systolic: parseInt(e.target.value) || 0
                    }
                  }
                }
              })}
              placeholder="収縮期"
            />
            <span>/</span>
            <Input
              type="number"
              value={registry.hospitalCourse?.vitals?.bloodPressure?.diastolic || ''}
              onChange={(e) => setRegistry({
                ...registry,
                hospitalCourse: {
                  ...registry.hospitalCourse!,
                  vitals: {
                    ...registry.hospitalCourse?.vitals!,
                    bloodPressure: {
                      ...registry.hospitalCourse?.vitals?.bloodPressure!,
                      diastolic: parseInt(e.target.value) || 0
                    }
                  }
                }
              })}
              placeholder="拡張期"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">脈拍</label>
          <Input
            type="number"
            value={registry.hospitalCourse?.vitals?.pulse || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                vitals: {
                  ...registry.hospitalCourse?.vitals!,
                  pulse: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="回/分"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">呼吸</label>
          <Input
            type="number"
            value={registry.hospitalCourse?.vitals?.respiration || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                vitals: {
                  ...registry.hospitalCourse?.vitals!,
                  respiration: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="回/分"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">体温</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.vitals?.temperature || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                vitals: {
                  ...registry.hospitalCourse?.vitals!,
                  temperature: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="℃"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SpO2</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={registry.hospitalCourse?.vitals?.spo2 || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                vitals: {
                  ...registry.hospitalCourse?.vitals!,
                  spo2: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="%"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">酸素</label>
          <Input
            type="number"
            value={registry.hospitalCourse?.vitals?.oxygen || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                vitals: {
                  ...registry.hospitalCourse?.vitals!,
                  oxygen: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="L/分"
          />
        </div>
      </div>

      {/* 瞳孔・対光反射 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">瞳孔（右, 左）</label>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={registry.hospitalCourse?.vitals?.pupil?.right || ''}
              onChange={(e) => setRegistry({
                ...registry,
                hospitalCourse: {
                  ...registry.hospitalCourse!,
                  vitals: {
                    ...registry.hospitalCourse?.vitals!,
                    pupil: {
                      ...registry.hospitalCourse?.vitals?.pupil!,
                      right: e.target.value
                    }
                  }
                }
              })}
              placeholder="右瞳孔"
            />
            <span className="text-gray-500">,</span>
            <Input
              type="text"
              value={registry.hospitalCourse?.vitals?.pupil?.left || ''}
              onChange={(e) => setRegistry({
                ...registry,
                hospitalCourse: {
                  ...registry.hospitalCourse!,
                  vitals: {
                    ...registry.hospitalCourse?.vitals!,
                    pupil: {
                      ...registry.hospitalCourse?.vitals?.pupil!,
                      left: e.target.value
                    }
                  }
                }
              })}
              placeholder="左瞳孔"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">対光反射（右, 左）</label>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={registry.hospitalCourse?.vitals?.lightReflex?.right || ''}
              onChange={(e) => setRegistry({
                ...registry,
                hospitalCourse: {
                  ...registry.hospitalCourse!,
                  vitals: {
                    ...registry.hospitalCourse?.vitals!,
                    lightReflex: {
                      ...registry.hospitalCourse?.vitals?.lightReflex!,
                      right: e.target.value
                    }
                  }
                }
              })}
              placeholder="右反射"
            />
            <span className="text-gray-500">,</span>
            <Input
              type="text"
              value={registry.hospitalCourse?.vitals?.lightReflex?.left || ''}
              onChange={(e) => setRegistry({
                ...registry,
                hospitalCourse: {
                  ...registry.hospitalCourse!,
                  vitals: {
                    ...registry.hospitalCourse?.vitals!,
                    lightReflex: {
                      ...registry.hospitalCourse?.vitals?.lightReflex!,
                      left: e.target.value
                    }
                  }
                }
              })}
              placeholder="左反射"
            />
          </div>
        </div>
      </div>
    </div>

    {/* 血液ガス分析 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">血液ガス分析</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">採血部位</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="abgType"
                value="arterial"
                checked={registry.hospitalCourse?.abg?.type === 'arterial'}
                onChange={(e) => setRegistry({
                  ...registry,
                  hospitalCourse: {
                    ...registry.hospitalCourse!,
                    abg: {
                      ...registry.hospitalCourse?.abg!,
                      type: e.target.value as any
                    }
                  }
                })}
                className="mr-2"
              />
              動脈
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="abgType"
                value="venous"
                checked={registry.hospitalCourse?.abg?.type === 'venous'}
                onChange={(e) => setRegistry({
                  ...registry,
                  hospitalCourse: {
                    ...registry.hospitalCourse!,
                    abg: {
                      ...registry.hospitalCourse?.abg!,
                      type: e.target.value as any
                    }
                  }
                })}
                className="mr-2"
              />
              静脈
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">FiO2</label>
          <Input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={registry.hospitalCourse?.abg?.fio2 || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                abg: {
                  ...registry.hospitalCourse?.abg!,
                  fio2: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="0.21-1.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
          <Input
            type="number"
            step="0.01"
            min="6.8"
            max="7.8"
            value={registry.hospitalCourse?.abg?.ph || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                abg: {
                  ...registry.hospitalCourse?.abg!,
                  ph: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="7.35-7.45"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PaCO2</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.abg?.paco2 || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                abg: {
                  ...registry.hospitalCourse?.abg!,
                  paco2: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="mmHg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PaO2</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.abg?.pao2 || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                abg: {
                  ...registry.hospitalCourse?.abg!,
                  pao2: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="mmHg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HCO3-</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.abg?.hco3 || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                abg: {
                  ...registry.hospitalCourse?.abg!,
                  hco3: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="mEq/L"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BE</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.abg?.be || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                abg: {
                  ...registry.hospitalCourse?.abg!,
                  be: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="mEq/L"
          />
        </div>
      </div>
    </div>

    {/* 検査結果 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">検査結果</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WBC</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.labResults?.wbc || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                labResults: {
                  ...registry.hospitalCourse?.labResults!,
                  wbc: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="×10³/μL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hb</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.labResults?.hb || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                labResults: {
                  ...registry.hospitalCourse?.labResults!,
                  hb: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="g/dL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ht</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.labResults?.ht || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                labResults: {
                  ...registry.hospitalCourse?.labResults!,
                  ht: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="%"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plt</label>
          <Input
            type="number"
            value={registry.hospitalCourse?.labResults?.plt || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                labResults: {
                  ...registry.hospitalCourse?.labResults!,
                  plt: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="×10⁴/μL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">T.Bil</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.labResults?.tbil || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                labResults: {
                  ...registry.hospitalCourse?.labResults!,
                  tbil: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="mg/dL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cre</label>
          <Input
            type="number"
            step="0.01"
            value={registry.hospitalCourse?.labResults?.cre || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                labResults: {
                  ...registry.hospitalCourse?.labResults!,
                  cre: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="mg/dL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Na</label>
          <Input
            type="number"
            value={registry.hospitalCourse?.labResults?.na || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                labResults: {
                  ...registry.hospitalCourse?.labResults!,
                  na: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="mEq/L"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">K</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.labResults?.k || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                labResults: {
                  ...registry.hospitalCourse?.labResults!,
                  k: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="mEq/L"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lactate</label>
          <Input
            type="number"
            step="0.1"
            value={registry.hospitalCourse?.labResults?.lactate || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                labResults: {
                  ...registry.hospitalCourse?.labResults!,
                  lactate: parseFloat(e.target.value) || 0
                }
              }
            })}
            placeholder="mmol/L"
          />
        </div>
      </div>
    </div>

    {/* 機能的転帰 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">機能的転帰</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPC 退院時</label>
          <Input
            type="number"
            min="1"
            max="5"
            value={registry.hospitalCourse?.functionalOutcome?.cpcDischarge || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                functionalOutcome: {
                  ...registry.hospitalCourse?.functionalOutcome!,
                  cpcDischarge: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="1-5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPC 3ヶ月後</label>
          <Input
            type="number"
            min="1"
            max="5"
            value={registry.hospitalCourse?.functionalOutcome?.cpcThreeMonth || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                functionalOutcome: {
                  ...registry.hospitalCourse?.functionalOutcome!,
                  cpcThreeMonth: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="1-5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">mRS 退院時</label>
          <Input
            type="number"
            min="0"
            max="6"
            value={registry.hospitalCourse?.functionalOutcome?.mrsDischarge || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                functionalOutcome: {
                  ...registry.hospitalCourse?.functionalOutcome!,
                  mrsDischarge: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="0-6"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">mRS 3ヶ月後</label>
          <Input
            type="number"
            min="0"
            max="6"
            value={registry.hospitalCourse?.functionalOutcome?.mrsThreeMonth || ''}
            onChange={(e) => setRegistry({
              ...registry,
              hospitalCourse: {
                ...registry.hospitalCourse!,
                functionalOutcome: {
                  ...registry.hospitalCourse?.functionalOutcome!,
                  mrsThreeMonth: parseInt(e.target.value) || 0
                }
              }
            })}
            placeholder="0-6"
          />
        </div>
      </div>
    </div>

    {/* ドクターカー活動の問題点 */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">ドクターカー活動の問題点</h3>
      <textarea
        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
        rows={4}
        value={registry.activityProblems || ''}
        onChange={(e) => setRegistry({
          ...registry,
          activityProblems: e.target.value
        })}
        placeholder="ドクターカー活動の問題点や改善点について記入してください"
      />
    </div>
  </div>
);