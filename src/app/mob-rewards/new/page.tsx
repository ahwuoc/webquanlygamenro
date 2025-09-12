'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import MobRewardForm, { MobRewardFormData } from '@/components/MobRewardForm';

export default function NewMobRewardPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: MobRewardFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/mob-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        router.push(`/mob-rewards/${created.id}/edit`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Tạo thất bại: ${err.error || res.status}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Thêm Mob Reward</h1>
            <p className="text-gray-600">Tạo cấu hình drop item cho mob</p>
          </div>
          <Button href="/mob-rewards">Quay lại</Button>
        </div>

        <MobRewardForm submitting={submitting} submitLabel="Tạo" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
