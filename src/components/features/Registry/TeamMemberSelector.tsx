import React, { useState, useEffect } from 'react';
import { TeamMember, TeamMemberOnScene } from '@/types/registry';
import { teamMembers, roleLabels, roleColors, getMembersByRole, searchMembersByName } from '@/data/teamMembers';

interface TeamMemberSelectorProps {
  selectedMembers: TeamMemberOnScene[];
  onMembersChange: (members: TeamMemberOnScene[]) => void;
  className?: string;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  selectedMembers,
  onMembersChange,
  className = ''
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [selectedRole, setSelectedRole] = useState<TeamMember['role'] | 'all'>('all');

  // メンバーフィルタリング
  useEffect(() => {
    let filtered = teamMembers;

    // 役割でフィルタ
    if (selectedRole !== 'all') {
      filtered = getMembersByRole(selectedRole);
    }

    // 検索でフィルタ
    if (searchTerm) {
      filtered = searchMembersByName(searchTerm);
    }

    // 既に選択済みのメンバーを除外
    const selectedMemberIds = selectedMembers.map(sm => sm.memberId);
    filtered = filtered.filter(member => !selectedMemberIds.includes(member.id));

    setFilteredMembers(filtered);
  }, [searchTerm, selectedRole, selectedMembers]);

  const handleAddMember = (member: TeamMember) => {
    const newMemberOnScene: TeamMemberOnScene = {
      memberId: member.id,
      member: member,
      arrivalTime: { toDate: () => new Date() } as any, // 現在時刻をデフォルト
      primaryRole: member.role === 'doctor' ? '主治医' : member.role === 'emergency-nurse' ? '主担当看護師' : '支援'
    };

    onMembersChange([...selectedMembers, newMemberOnScene]);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleRemoveMember = (memberId: string) => {
    onMembersChange(selectedMembers.filter(sm => sm.memberId !== memberId));
  };

  const handleUpdateMember = (memberId: string, updates: Partial<TeamMemberOnScene>) => {
    const updatedMembers = selectedMembers.map(sm => 
      sm.memberId === memberId ? { ...sm, ...updates } : sm
    );
    onMembersChange(updatedMembers);
  };

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          現場活動メンバー
        </label>

        {/* 選択済みメンバー一覧 */}
        {selectedMembers.length > 0 && (
          <div className="mb-4 space-y-2">
            {selectedMembers.map((memberOnScene) => (
              <div key={memberOnScene.memberId} className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{memberOnScene.member.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${roleColors[memberOnScene.member.role]}`}>
                      {roleLabels[memberOnScene.member.role]}
                    </span>
                    {memberOnScene.member.qualification && (
                      <span className="text-xs text-gray-500">
                        {memberOnScene.member.qualification}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(memberOnScene.memberId)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    削除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <label className="text-xs text-gray-500">現場での役割</label>
                    <input
                      type="text"
                      value={memberOnScene.primaryRole}
                      onChange={(e) => handleUpdateMember(memberOnScene.memberId, { primaryRole: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="例：主治医、主担当看護師"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">到着時刻</label>
                    <input
                      type="time"
                      value={formatTime(memberOnScene.arrivalTime)}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const date = new Date();
                        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        handleUpdateMember(memberOnScene.memberId, { 
                          arrivalTime: { toDate: () => date } as any 
                        });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">特記事項</label>
                    <input
                      type="text"
                      value={memberOnScene.notes || ''}
                      onChange={(e) => handleUpdateMember(memberOnScene.memberId, { notes: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="特記事項があれば入力"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* メンバー追加ボタン */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50 flex items-center justify-between"
          >
            <span className="text-gray-500">メンバーを追加...</span>
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {/* ドロップダウンメニュー */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              <div className="p-3 border-b border-gray-200">
                {/* 検索フィールド */}
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="名前・資格・部署で検索..."
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-sm"
                />

                {/* 役割フィルタ */}
                <div className="flex space-x-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('all')}
                    className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                      selectedRole === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    全て
                  </button>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role as TeamMember['role'])}
                      className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                        selectedRole === role ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* メンバーリスト */}
              <div className="max-h-64 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {selectedMembers.length === teamMembers.length ? 
                      '全てのメンバーが選択済みです' : 
                      '条件に合うメンバーがいません'}
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleAddMember(member)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{member.name}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${roleColors[member.role]}`}>
                                {roleLabels[member.role]}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {member.qualification} • {member.department}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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