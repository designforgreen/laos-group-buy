'use client';

interface GroupProgressProps {
  current: number;
  target: number;
  members?: { name: string; avatar?: string }[];
}

export default function GroupProgress({ current, target, members = [] }: GroupProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = target - current;

  // 生成占位头像
  const avatars = [];
  for (let i = 0; i < target; i++) {
    if (i < members.length) {
      avatars.push({ filled: true, name: members[i].name });
    } else if (i < current) {
      avatars.push({ filled: true, name: `用户${i + 1}` });
    } else {
      avatars.push({ filled: false, name: '' });
    }
  }

  return (
    <div className="space-y-3">
      {/* 进度条 */}
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentage >= 100 ? 'bg-green-500' : 'bg-primary-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="absolute -top-1 right-0 text-xs text-gray-500">
          {current}/{target}
        </div>
      </div>

      {/* 头像列表 */}
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-sm mr-2">👥</span>
        <div className="flex -space-x-2">
          {avatars.map((avatar, index) => (
            <div
              key={index}
              className={`
                w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs
                ${avatar.filled
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-400 border-dashed border-gray-300'
                }
              `}
              title={avatar.name}
            >
              {avatar.filled ? avatar.name.charAt(0).toUpperCase() : '?'}
            </div>
          ))}
        </div>
        {remaining > 0 && (
          <span className="ml-2 text-sm text-primary-500 font-medium">
            ຍັງຂາດ {remaining} ຄົນ (还差{remaining}人)
          </span>
        )}
        {remaining === 0 && (
          <span className="ml-2 text-sm text-green-500 font-medium">
            ✅ ສຳເລັດແລ້ວ! (成团成功!)
          </span>
        )}
      </div>
    </div>
  );
}
