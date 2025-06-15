import { TeamMember } from '@/types/registry';

// 登録済みチームメンバーのマスターデータ
export const teamMembers: TeamMember[] = [
  // 医師
  {
    id: 'member-001',
    name: '田中 太郎',
    role: 'doctor',
    qualification: '救急科専門医',
    employeeId: 'D001',
    department: '救急科'
  },
  {
    id: 'member-002',
    name: '佐藤 花子',
    role: 'doctor',
    qualification: '内科専門医',
    employeeId: 'D002',
    department: '内科'
  },
  {
    id: 'member-003',
    name: '山田 一郎',
    role: 'doctor',
    qualification: '外科専門医',
    employeeId: 'D003',
    department: '外科'
  },

  // 救命救急師
  {
    id: 'member-004',
    name: '高橋 美咲',
    role: 'emergency-nurse',
    qualification: '救急看護認定看護師',
    employeeId: 'N001',
    department: '救急科'
  },
  {
    id: 'member-005',
    name: '鈴木 健太',
    role: 'emergency-nurse',
    qualification: 'ICLSインストラクター',
    employeeId: 'N002',
    department: '救急科'
  },

  // 研修医
  {
    id: 'member-006',
    name: '伊藤 雅人',
    role: 'resident',
    qualification: '初期研修医2年目',
    employeeId: 'R001',
    department: '研修医科'
  },
  {
    id: 'member-007',
    name: '小川 麻衣',
    role: 'resident',
    qualification: '後期研修医1年目',
    employeeId: 'R002',
    department: '救急科'
  },

  // 看護師
  {
    id: 'member-008',
    name: '中村 由美',
    role: 'nurse',
    qualification: '看護師',
    employeeId: 'N003',
    department: '手術室'
  },
  {
    id: 'member-009',
    name: '加藤 直樹',
    role: 'nurse',
    qualification: '看護師',
    employeeId: 'N004',
    department: 'ICU'
  },
  {
    id: 'member-010',
    name: '渡辺 恵子',
    role: 'nurse',
    qualification: '看護師',
    employeeId: 'N005',
    department: '病棟'
  },

  // その他
  {
    id: 'member-011',
    name: '松本 隆',
    role: 'other',
    qualification: '臨床工学技士',
    employeeId: 'T001',
    department: 'ME室'
  },
  {
    id: 'member-012',
    name: '林 真理子',
    role: 'other',
    qualification: '薬剤師',
    employeeId: 'P001',
    department: '薬剤部'
  }
];

// 役割別のラベル
export const roleLabels: Record<TeamMember['role'], string> = {
  'doctor': '医師',
  'emergency-nurse': '救命救急師',
  'resident': '研修医',
  'nurse': '看護師',
  'other': 'その他'
};

// 役割による色分け
export const roleColors: Record<TeamMember['role'], string> = {
  'doctor': 'bg-red-100 text-red-800',
  'emergency-nurse': 'bg-orange-100 text-orange-800',
  'resident': 'bg-blue-100 text-blue-800',
  'nurse': 'bg-green-100 text-green-800',
  'other': 'bg-gray-100 text-gray-800'
};

// 役割別にメンバーを取得
export const getMembersByRole = (role: TeamMember['role']): TeamMember[] => {
  return teamMembers.filter(member => member.role === role);
};

// IDでメンバーを検索
export const getMemberById = (id: string): TeamMember | undefined => {
  return teamMembers.find(member => member.id === id);
};

// 名前でメンバーを検索
export const searchMembersByName = (query: string): TeamMember[] => {
  const lowerQuery = query.toLowerCase();
  return teamMembers.filter(member => 
    member.name.toLowerCase().includes(lowerQuery) ||
    member.qualification?.toLowerCase().includes(lowerQuery) ||
    member.department?.toLowerCase().includes(lowerQuery)
  );
};