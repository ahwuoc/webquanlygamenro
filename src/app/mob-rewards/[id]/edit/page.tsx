'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Popconfirm } from 'antd';
import MobRewardAdvancedForm, { AdvancedGroupForm } from '@/components/MobRewardAdvancedForm';

interface PageProps {
  params: { id: string };
}

export default function EditMobRewardPage({ params }: PageProps) {
  const router = useRouter();
  const resolved = use(params as any);
  const id = parseInt((resolved as { id: string }).id, 10);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<AdvancedGroupForm | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || isNaN(id) || id <= 0) {
        alert('ID không hợp lệ');
        router.push('/mob-rewards');
        return;
      }
      const res = await fetch(`/api/mob-rewards/${id}`);
      if (res.ok) {
        const json = await res.json();
        // Transform API response to AdvancedGroupForm
        const items = Array.isArray(json._items) ? json._items.map((it: any) => ({
          id: it.id,
          item_id: it.item_id,
          quantity_min: it.quantity_min,
          quantity_max: it.quantity_max,
          drop_rate: it.drop_rate,
          options: Array.isArray(it.mob_reward_item_options) ? it.mob_reward_item_options.map((op: any) => ({ id: op.id, option_id: op.option_id, param: op.param })) : [],
        })) : [];
        setData({
          mob_id: json.mob_id,
          map_restriction: json.map_restriction ?? null,
          planet_restriction: json.gender_restriction ?? -1,
          is_active: !!json.is_active,
          items,
        });
      } else {
        alert('Không tìm thấy bản ghi');
        router.push('/mob-rewards');
      }
      setLoading(false);
    };
    fetchData();
  }, [id, router]);

  const handleSubmit = async (form: AdvancedGroupForm) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/mob-rewards/${id}?replace_items=true`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        alert('Cập nhật thành công');
        router.push('/mob-rewards');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Cập nhật thất bại: ${err.error || res.status}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/mob-rewards/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/mob-rewards');
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Xóa thất bại: ${err.error || res.status}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-8 lg:px-12">
        <div className="max-w-none">Đang tải...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-8 lg:px-12">
      <div className="max-w-none space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sửa Mob Reward #{id}</h1>
            <p className="text-gray-600">Chỉnh sửa cấu hình drop item</p>
          </div>
          <div className="flex gap-2">
            <Button href="/mob-rewards">Quay lại</Button>
            <Popconfirm title="Xóa bản ghi?" onConfirm={handleDelete} okText="Xóa" cancelText="Hủy">
              <Button danger>Xóa</Button>
            </Popconfirm>
          </div>
        </div>

        <MobRewardAdvancedForm value={data} submitting={submitting} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
