import { Timestamp } from 'firebase/firestore';

export interface DoctorCarRegistry {
  id: string;
  caseId: string;
  registryNumber: string;
  
  // 基本情報
  patientNumber: string;
  patientAge: number;
  patientGender: 'male' | 'female';
  medicalInstitution: 'disaster' | 'medical-dental' | 'nagayama' | 'sengaki';
  
  // ドクターカー出動要請基準
  dispatchCriteria: {
    category1: boolean; // 心停止
    category2: {
      selected: boolean; // 心停止寸前を疑う
      breathing: boolean; // 呼吸の異常
      circulation: boolean; // 循環の異常
      consciousness: boolean; // 意識の異常
    };
    category3: {
      selected: boolean; // 外因によるもの
      fall: boolean; // 転落・墜落
      traffic: boolean; // 交通事故
      weapon: boolean; // 銃創・刺創
      amputation: boolean; // 四肢切断
      trapped: boolean; // 要救助の挟まり
      burn: boolean; // 重度熱傷
      multiple: boolean; // 多数傷者発生
    };
    category4: {
      selected: boolean; // 内因によるもの
      stroke: boolean; // 脳卒中疑い・意識障害
      cardiac: boolean; // 心疾患疑い
      other: boolean; // その他
    };
    category5: {
      selected: boolean; // その他
      fireCommand: boolean; // 警防本部が効果的と判断
    };
    category6: {
      selected: boolean; // DMAT
      paramedic: boolean; // 救急隊長が効果的と判断
    };
  };
  
  // 発症前のADL
  preOnsetADL: 'independent' | 'care-required' | 'unknown';
  
  // 現場へのアクセス
  sceneAccess: 'easy' | 'rescue-needed' | 'difficult' | 'unknown';
  
  // PA連携
  paCooperation: {
    present: boolean;
    pumpArrivalTime?: string;
  };
  
  // 出場車輌
  dispatchVehicle: string;
  
  // 発生場所
  location: {
    type: 'home-house' | 'home-apartment-low' | 'home-apartment-high' | 'station' | 
          'commercial' | 'office' | 'factory' | 'road' | 'school' | 'other';
    details: string;
  };
  
  // 時間経過
  timelineEms: {
    awareness: Timestamp;
    arrival: Timestamp;
    contact: Timestamp;
    departure: Timestamp;
    hospitalArrival: Timestamp;
  };
  
  timelineDoctorCar: {
    awareness: Timestamp;
    arrival: Timestamp;
    contact: Timestamp;
    departure: Timestamp;
    hospitalArrival: Timestamp;
  };
  
  totalActivityTime: number; // 分
  doctorContactTime: number; // 分
  sceneActivityTime: number; // 分
  
  // 患者バイタル
  vitals: {
    gcs: {
      total: number;
      eye: number;
      verbal: number;
      motor: number;
    };
    jcs: number;
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    pulse: number;
    respiration: number;
    temperature: number;
    spo2: number;
    oxygen: number;
    pupil: string;
    lightReflex: string;
  };
  
  // 搬送先
  destination: {
    type: 'own-tertiary' | 'own-secondary' | 'other-tertiary' | 'other-secondary' | 
          'cancel-before-arrival' | 'cancel-mild' | 'social-death' | 'other';
    cancelReason?: string;
    socialDeathContribution?: {
      helpful: boolean;
      reasons: {
        emsJudgment: boolean;
        familyAcceptance: boolean;
        other: boolean;
        otherReason?: string;
      };
    };
  };
  
  // 該当分類
  category: 'C' | 'T' | 'S' | 'M' | null;
  
  // 推定病名
  estimatedDiagnosis: string[];
  
  // II-C: 心停止関連データ
  cardiacArrest?: {
    witness: 'present' | 'absent' | 'unknown';
    bystanderCPR: {
      performed: 'present' | 'absent' | 'unknown';
      chestCompression: boolean;
      artificialRespiration: boolean;
      aed: boolean;
    };
    fireGuidance: 'present' | 'absent' | 'unknown';
    
    // 病歴情報
    circumstances: {
      bathing: boolean;
      exercise: boolean;
      sitting: boolean;
      eating: boolean;
      unknown: boolean;
      excretion: boolean;
      walking: boolean;
      sleeping: boolean;
      none: boolean;
    };
    
    // 前駆症状
    precursorSymptoms: {
      dyspnea: boolean;
      headache: boolean;
      abdominalPain: boolean;
      other: boolean;
      unknown: boolean;
      seizure: boolean;
      chestPain: boolean;
      backPain: boolean;
      none: boolean;
    };
    
    estimatedArrestTime: string;
    initialRhythm: 'asystole' | 'pea' | 'vf' | 'pulseless-vt' | 'pulse-present';
    
    // 現場処置 - 救急隊
    emsTreatment: {
      intubation: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
      lma: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
      ivAccess: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
      boneMarrow: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
      medication: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
      defibrillation: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
    };
    
    // 現場処置 - ドクターカー
    doctorCarTreatment: {
      intubation: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
      lma: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
      ivAccess: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
      medication: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
      shock: { result: 'success' | 'failure' | 'none' | 'unknown'; time: string };
    };
    
    prehospitalTermination: {
      performed: 'present' | 'absent' | 'unknown';
      reason: string;
    };
    
    rosc: {
      duringTransport: 'present' | 'absent' | 'unknown';
      hospitalArrivalRhythm: 'asystole' | 'pea' | 'vf' | 'pulseless-vt' | 'pulse-present';
      erOutcome: 'rosc-achieved' | 'no-rosc' | 'unknown';
      roscTime: string;
      terminationTime: string;
    };
    
    hospitalization: 'er-death' | 'admission' | 'transfer' | 'unknown';
    
    // 既往歴
    medicalHistory: {
      cerebralDisease: boolean;
      cardiovascular: boolean;
      gastrointestinal: boolean;
      respiratory: boolean;
      hepatic: boolean;
      malignancy: boolean;
      other: boolean;
    };
    
    // 確定診断
    finalDiagnosis: {
      acs: boolean;
      cerebrovascular: boolean;
      poisoning: boolean;
      aorticDisease: boolean;
      respiratory: boolean;
      strangulation: boolean;
      presumedCardiac: boolean;
      cerebralDisease: boolean;
      otherInternal: boolean;
    };
  };
  
  // II-T: 外傷関連データ
  trauma?: {
    mechanism: 'blunt' | 'penetrating' | 'burn';
    
    // 現場処置
    fieldTreatment: {
      oxygenTherapy: boolean;
      intubation: boolean;
      thoracentesis: boolean;
    };
    
    // A・B
    airwayBreathing: {
      airway: boolean;
      cricothyroidotomy: boolean;
      chestDrainage: boolean;
    };
    
    oxygenAmount: number;
    
    // C
    circulation: {
      ivAccess: boolean;
      fastPositive: boolean;
      shockPants: boolean;
      emergencyThoracotomy: boolean;
      massiveFluid: boolean;
      fastNegative: boolean;
      aorticBalloon: boolean;
      medication: boolean;
      tourniquet: boolean;
      defibrillation: boolean;
    };
    
    prehospitalFluidAmount: number;
    medicationNames: string;
    
    hospitalDecision: 'present' | 'absent' | 'other';
    
    // AIS/ISS
    aisScores: {
      surface: number;
      headNeck: number;
      face: number;
      chest: number;
      abdomen: number;
      extremities: number;
    };
    iss: number;
    rts: number;
    ps: number;
    
    // 手術
    initialSurgery: {
      craniotomy: boolean;
      trephination: boolean;
      thoracotomy: boolean;
      laparotomy: boolean;
      fracture: boolean;
      vascularReconnection: boolean;
      tae: boolean;
      vascularReconstruction: boolean;
      endoscopic: boolean;
      hemostasis: boolean;
      other: boolean;
    };
    
    surgery48h: {
      craniotomy: boolean;
      trephination: boolean;
      thoracotomy: boolean;
      laparotomy: boolean;
      fracture: boolean;
      vascularReconnection: boolean;
      tae: boolean;
      vascularReconstruction: boolean;
      endoscopic: boolean;
      hemostasis: boolean;
      other: boolean;
    };
  };
  
  // II-S: 脳卒中関連データ
  stroke?: {
    suspectedCondition: {
      infarction: boolean;
      sah: boolean;
      seizure: boolean;
      metabolic: boolean;
      alcohol: boolean;
      tia: boolean;
      hemorrhage: boolean;
      hypoglycemia: boolean;
      poisoning: boolean;
      other: boolean;
    };
    
    detailedTimeline: string;
    onsetTime: string;
    lastSeenNormalTime: string;
    firstCtTime: string;
    treatmentStartTime: string;
    
    // 診断の正確性
    bilateralBp: {
      measured: boolean;
      right: { systolic: number; diastolic: number };
      left: { systolic: number; diastolic: number };
    };
    
    bloodGlucose: {
      measured: boolean;
      value: number;
    };
    
    cpss: {
      facialDrooping: boolean;
      armWeakness: boolean;
      speech: boolean;
    };
    
    kpss: {
      consciousness: number;
      consciousnessDisorder: number;
      rightArmParalysis: number;
      leftArmParalysis: number;
      rightLegParalysis: number;
      leftLegParalysis: number;
      speech: number;
      total: number;
    };
    
    hospitalDiagnosis: {
      infarction: boolean;
      sah: boolean;
      seizure: boolean;
      metabolic: boolean;
      alcohol: boolean;
      tia: boolean;
      hemorrhage: boolean;
      hypoglycemia: boolean;
      poisoning: boolean;
      other: boolean;
    };
    
    priorNotification: {
      provided: boolean;
      details: string;
    };
    
    // 医師の積極的医療介入
    medicalIntervention: {
      airwayManagement: boolean;
      respiratoryManagement: boolean;
      fluidTherapy: boolean;
      glucoseManagement: boolean;
      hypertensionManagement: boolean;
    };
    
    bloodPressure: {
      initial: { systolic: number; diastolic: number };
      postTreatment: { systolic: number; diastolic: number };
      postTransport: { systolic: number; diastolic: number };
    };
    
    seizureManagement: boolean;
    seizureDuration: number;
    
    tpa: {
      administered: boolean;
      time: string;
    };
    
    nihss: {
      prehospital: number;
      initial: number;
      twentyFourHour: number;
    };
  };
  
  // II-M: ACS関連データ
  acs?: {
    medicalHistory: {
      hypertension: boolean;
      diabetes: boolean;
      hyperlipidemia: boolean;
      smoking: boolean;
      familyHistory: boolean;
      heartDisease: boolean;
      respiratoryDisease: boolean;
    };
    
    treatment: {
      oxygenTherapy: boolean;
      intubation: boolean;
      ivDrip: boolean;
      oxygenAmount: number;
    };
    
    hospitalContactTime: string;
    
    // 病院外での所見
    prehospitalFindings: {
      ecgFindings: {
        rhythm: 'sinus' | 'af' | 'junctional' | 'other' | 'unknown';
        heartRate: number;
        stChanges: {
          elevation: boolean;
          depression: boolean;
          location: string;
        };
      };
      echoFindings: {
        wallMotionAbnormality: boolean;
        aorticDissection: boolean;
        valvularDisease: boolean;
        pericardialEffusion: boolean;
        pleuralEffusion: boolean;
        other: boolean;
      };
    };
    
    suspectedCondition: {
      ami: boolean;
      angina: boolean;
      arrhythmia: boolean;
      otherAcs: boolean;
      aorticDissection: boolean;
      acuteHeartFailure: boolean;
      other: boolean;
    };
    
    hospitalDiagnosis: {
      ami: boolean;
      angina: boolean;
      arrhythmia: boolean;
      otherAcs: boolean;
      aorticDissection: boolean;
      acuteHeartFailure: boolean;
      other: boolean;
    };
    
    estimatedOnsetTime: string;
    catheterizationStartTime: string;
    doorToBalloonTime: number;
  };
  
  // III 院内経過
  hospitalCourse: {
    vitals: {
      gcs: {
        total: number;
        eye: number;
        verbal: number;
        motor: number;
      };
      bloodPressure: {
        systolic: number;
        diastolic: number;
      };
      pulse: number;
      respiration: number;
      temperature: number;
      spo2: number;
      oxygen: number;
      pupil: {
        right: string;
        left: string;
      };
      lightReflex: {
        right: string;
        left: string;
      };
    };
    
    abg: {
      type: 'arterial' | 'venous';
      fio2: number;
      ph: number;
      paco2: number;
      pao2: number;
      hco3: number;
      be: number;
    };
    
    labResults: {
      wbc: number;
      hb: number;
      ht: number;
      plt: number;
      tbil: number;
      cre: number;
      na: number;
      k: number;
      lactate: number;
    };
    
    functionalOutcome: {
      cpcDischarge: number;
      cpcThreeMonth: number;
      mrsDischarge: number;
      mrsThreeMonth: number;
    };
  };
  
  // ドクターカー活動の問題点
  activityProblems: string;
  
  // メタデータ
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy?: string;
  isCompleted: boolean;
  submittedAt?: Timestamp;
}