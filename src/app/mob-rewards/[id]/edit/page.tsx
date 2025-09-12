'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Popconfirm } from 'antd';
import MobRewardForm, { MobRewardFormData } from '@/components/MobRewardForm';

interface PageProps {
  params: { id: string };
}

export default function EditMobRewardPage({ params }: PageProps) {
  const router = useRouter();
  const resolved = use(params as any);
  const id = parseInt((resolved as { id: string }).id, 10);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<MobRewardFormData | null>(null);

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
        setData(json);
      } else {
        alert('Không tìm thấy bản ghi');
        router.push('/mob-rewards');
      }
      setLoading(false);
    };
    fetchData();
  }, [id, router]);

  const handleSubmit = async (form: MobRewardFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/mob-rewards/${id}`, {
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
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">Đang tải...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
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

        <MobRewardForm value={data} submitting={submitting} submitLabel="Cập nhật" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
