import { DoctorCarRegistry } from '@/types/registry';
import { config } from '@/config/environment';
import { db } from '@/config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  Timestamp
} from 'firebase/firestore';

class RegistryService {
  private readonly collectionName = 'registries';
  
  async getRegistryByCaseId(caseId: string): Promise<DoctorCarRegistry | null> {
    console.log('Registry service: Getting registry for case', caseId);
    
    try {
      if (config.demoMode) {
        return this.getMockRegistryByCaseId(caseId);
      }

      const registriesRef = collection(db, this.collectionName);
      const q = query(registriesRef, where('caseId', '==', caseId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as DoctorCarRegistry;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get registry:', error);
      throw error;
    }
  }

  async saveRegistry(registry: Partial<DoctorCarRegistry>): Promise<string> {
    console.log('Registry service: Saving registry', registry);
    
    try {
      if (config.demoMode) {
        return this.saveMockRegistry(registry);
      }

      const now = Timestamp.now();
      const registryData = {
        ...registry,
        updatedAt: now
      };

      if (!registry.id) {
        // 新規作成
        registryData.createdAt = now;
        const docRef = doc(collection(db, this.collectionName));
        await setDoc(docRef, registryData);
        return docRef.id;
      } else {
        // 更新
        const docRef = doc(db, this.collectionName, registry.id);
        await updateDoc(docRef, registryData);
        return registry.id;
      }
    } catch (error) {
      console.error('Failed to save registry:', error);
      throw error;
    }
  }

  async getCompletedRegistries(): Promise<DoctorCarRegistry[]> {
    console.log('Registry service: Getting completed registries');
    
    try {
      if (config.demoMode) {
        return this.getMockCompletedRegistries();
      }

      const registriesRef = collection(db, this.collectionName);
      const q = query(registriesRef, where('isCompleted', '==', true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DoctorCarRegistry));
    } catch (error) {
      console.error('Failed to get completed registries:', error);
      throw error;
    }
  }

  async exportRegistriesToCSV(registries: DoctorCarRegistry[]): Promise<string> {
    const headers = [
      'レジストリ番号',
      '患者番号',
      '年齢',
      '性別',
      '医療機関',
      'ドクターカー覚知時刻',
      'ドクターカー現着時刻',
      'ドクターカー接触時刻',
      'ドクターカー現発時刻',
      'ドクターカー病着時刻',
      '出動要請基準',
      '発症前ADL',
      '現場アクセス',
      '出動番地',
      '発生場所',
      'GCS合計',
      'GCS-E',
      'GCS-V', 
      'GCS-M',
      '血圧',
      '脈拍',
      '呼吸',
      '体温',
      'SpO2',
      '酸素',
      '瞳孔',
      '対光反射',
      '搬送先',
      '該当分類',
      '推定病名',
      'ドクターカー活動の問題点'
    ];

    const rows = registries.map(r => [
      r.registryNumber || '',
      r.patientNumber || '',
      r.patientAge?.toString() || '',
      this.formatGender(r.patientGender),
      this.formatMedicalInstitution(r.medicalInstitution),
      this.formatTimestamp(r.timelineDoctorCar?.awareness),
      this.formatTimestamp(r.timelineDoctorCar?.arrival),
      this.formatTimestamp(r.timelineDoctorCar?.contact),
      this.formatTimestamp(r.timelineDoctorCar?.departure),
      this.formatTimestamp(r.timelineDoctorCar?.hospitalArrival),
      this.formatDispatchCriteria(r.dispatchCriteria),
      this.formatPreOnsetADL(r.preOnsetADL),
      this.formatSceneAccess(r.sceneAccess),
      r.dispatchVehicle || '',
      this.formatLocation(r.location),
      r.vitals?.gcs?.total?.toString() || '',
      r.vitals?.gcs?.eye?.toString() || '',
      r.vitals?.gcs?.verbal?.toString() || '',
      r.vitals?.gcs?.motor?.toString() || '',
      this.formatBloodPressure(r.vitals?.bloodPressure),
      r.vitals?.pulse?.toString() || '',
      r.vitals?.respiration?.toString() || '',
      r.vitals?.temperature?.toString() || '',
      r.vitals?.spo2?.toString() || '',
      r.vitals?.oxygen?.toString() || '',
      r.vitals?.pupil || '',
      r.vitals?.lightReflex || '',
      this.formatDestination(r.destination),
      r.category || '',
      r.estimatedDiagnosis?.join('; ') || '',
      r.activityProblems || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // デモモード用のメソッド
  private getMockRegistryByCaseId(caseId: string): DoctorCarRegistry | null {
    // LocalStorageから取得
    const stored = localStorage.getItem(`registry_${caseId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  private saveMockRegistry(registry: Partial<DoctorCarRegistry>): string {
    const id = registry.id || `registry_${Date.now()}`;
    const fullRegistry = {
      ...registry,
      id,
      updatedAt: { toDate: () => new Date() } as any
    } as DoctorCarRegistry;

    // LocalStorageに保存
    localStorage.setItem(`registry_${registry.caseId}`, JSON.stringify(fullRegistry));
    
    return id;
  }

  private getMockCompletedRegistries(): DoctorCarRegistry[] {
    const registries: DoctorCarRegistry[] = [];
    
    // LocalStorageから全レジストリを取得
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('registry_')) {
        const registry = JSON.parse(localStorage.getItem(key)!);
        if (registry.isCompleted) {
          registries.push(registry);
        }
      }
    }
    
    return registries;
  }

  // ユーティリティメソッド
  private formatTimestamp(timestamp?: Timestamp | Date | any): string {
    if (!timestamp) return '';
    try {
      const date = timestamp instanceof Date ? timestamp : 
                   timestamp.toDate ? timestamp.toDate() :
                   new Date(timestamp);
      return date.toLocaleString('ja-JP');
    } catch {
      return '';
    }
  }

  private formatGender(gender?: string): string {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      default: return '';
    }
  }

  private formatMedicalInstitution(institution?: string): string {
    switch (institution) {
      case 'disaster': return '災害';
      case 'medical-dental': return '医科歯科';
      case 'nagayama': return '永山';
      case 'sengaki': return '千駄木';
      default: return '';
    }
  }

  private formatDispatchCriteria(criteria?: any): string {
    if (!criteria) return '';
    const selected = [];
    
    if (criteria.category1) selected.push('I心停止');
    
    if (criteria.category2?.selected) {
      const subItems = [];
      if (criteria.category2.breathing) subItems.push('呼吸異常');
      if (criteria.category2.circulation) subItems.push('循環異常');
      if (criteria.category2.consciousness) subItems.push('意識異常');
      selected.push(`II心停止寸前(${subItems.join(',')})`);
    }
    
    if (criteria.category3?.selected) {
      const subItems = [];
      if (criteria.category3.fall) subItems.push('転落墜落');
      if (criteria.category3.traffic) subItems.push('交通事故');
      if (criteria.category3.weapon) subItems.push('銃創刺創');
      if (criteria.category3.amputation) subItems.push('四肢切断');
      if (criteria.category3.trapped) subItems.push('要救助挟まり');
      if (criteria.category3.burn) subItems.push('重度熱傷');
      if (criteria.category3.multiple) subItems.push('多数傷者');
      selected.push(`III外因(${subItems.join(',')})`);
    }
    
    if (criteria.category4?.selected) {
      const subItems = [];
      if (criteria.category4.stroke) subItems.push('脳卒中');
      if (criteria.category4.cardiac) subItems.push('心疾患');
      if (criteria.category4.other) subItems.push('その他');
      selected.push(`IV内因(${subItems.join(',')})`);
    }
    
    if (criteria.category5?.selected) {
      const subItems = [];
      if (criteria.category5.fireCommand) subItems.push('警防本部判断');
      selected.push(`Vその他(${subItems.join(',')})`);
    }
    
    if (criteria.category6?.selected) {
      const subItems = [];
      if (criteria.category6.paramedic) subItems.push('救急隊長判断');
      selected.push(`VIDMAT(${subItems.join(',')})`);
    }
    
    return selected.join(', ');
  }

  private formatPreOnsetADL(adl?: string): string {
    switch (adl) {
      case 'independent': return '自立';
      case 'care-required': return '要介護';
      case 'unknown': return '不明';
      default: return '';
    }
  }

  private formatSceneAccess(access?: string): string {
    switch (access) {
      case 'easy': return '容易';
      case 'rescue-needed': return 'レスキュー隊必要';
      case 'difficult': return '困難';
      case 'unknown': return '不明';
      default: return '';
    }
  }

  private formatLocation(location?: any): string {
    if (!location) return '';
    const typeMap = {
      'home-house': '自宅（戸建）',
      'home-apartment-low': '自宅（共同住宅10F以下）',
      'home-apartment-high': '自宅（共同住宅11F以上）',
      'station': '駅',
      'commercial': '商業施設',
      'office': 'オフィス',
      'factory': '工場',
      'road': '路上',
      'school': '学校',
      'other': 'その他'
    };
    const typeText = typeMap[location.type as keyof typeof typeMap] || '';
    return location.details ? `${typeText} (${location.details})` : typeText;
  }

  private formatBloodPressure(bp?: any): string {
    if (!bp || !bp.systolic || !bp.diastolic) return '';
    return `${bp.systolic}/${bp.diastolic}`;
  }

  private formatDestination(destination?: any): string {
    if (!destination) return '';
    const typeMap = {
      'own-tertiary': '自院三次',
      'own-secondary': '自院二次',
      'other-tertiary': '他院三次',
      'other-secondary': '他院二次',
      'cancel-before-arrival': '現着前キャンセル',
      'cancel-mild': '軽症キャンセル',
      'social-death': '社会死',
      'other': 'その他'
    };
    return typeMap[destination.type as keyof typeof typeMap] || '';
  }
}

export const registryService = new RegistryService();