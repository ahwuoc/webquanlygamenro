'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, message } from 'antd';

export default function GiftcodeCreatePage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    try {
      const values = await form.validateFields();
      setCreating(true);
      const payload = {
        code: values.code,
        name: values.name,
        description: values.description || null,
        max_uses: values.max_uses ?? 0,
        is_active: values.is_active ?? true,
        player_limit_type: values.player_limit_type ?? 'NONE',
        vip_level_min: values.vip_level_min ?? 0,
        expired_date: values.expired_date ? values.expired_date.toISOString() : null,
      };

      const res = await fetch('/api/giftcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Tạo giftcode thất bại');
      }
      const created = await res.json();
      message.success('Đã tạo giftcode');
      if (created?.id) router.push(`/giftcodes/${created.id}`);
      else router.push('/giftcodes');
    } catch (e: any) {
      if (e?.errorFields) message.error('Vui lòng kiểm tra lại các trường');
      else message.error(e?.message || 'Lỗi khi tạo giftcode');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tạo Gift Code</h1>
            <div className="text-gray-600">Điền thông tin giftcode và lưu để chuyển sang trang chỉnh sửa chi tiết</div>
          </div>
          <Button onClick={() => router.push('/giftcodes')}>Quay lại</Button>
        </div>

        <Card title="Thông tin chính">
          <Form layout="vertical" form={form}>
            <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Nhập code' }]}>
              <Input placeholder="Mã gift code" />
            </Form.Item>
            <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}>
              <Input placeholder="Tên hiển thị" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={3} placeholder="Mô tả" />
            </Form.Item>
            <Space className="w-full" wrap>
              <Form.Item name="max_uses" label="Giới hạn lượt" className="min-w-[180px]">
                <InputNumber min={0} placeholder="0 = unlimited" />
              </Form.Item>
              <Form.Item name="is_active" label="Trạng thái" className="min-w-[180px]" initialValue={true}>
                <Select options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
              </Form.Item>
              <Form.Item name="player_limit_type" label="Giới hạn player" className="min-w-[280px]" initialValue={'NONE'}>
                <Select
                  options={[
                    { label: 'Không giới hạn', value: 'NONE' },
                    { label: 'Chỉ cho phép player cụ thể', value: 'SPECIFIC_PLAYERS' },
                    { label: 'Chặn player cụ thể', value: 'EXCLUDE_PLAYERS' },
                    { label: 'Chỉ VIP', value: 'VIP_ONLY' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="vip_level_min" label="VIP min" className="min-w-[160px]" initialValue={0}>
                <InputNumber min={0} />
              </Form.Item>
              <Form.Item name="expired_date" label="Ngày hết hạn" className="min-w-[260px]">
                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
              </Form.Item>
            </Space>
          </Form>
        </Card>

        <div className="flex justify-end">
          <Space>
            <Button onClick={() => router.push('/giftcodes')}>Hủy</Button>
            <Button type="primary" loading={creating} onClick={handleCreate}>Tạo giftcode</Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
