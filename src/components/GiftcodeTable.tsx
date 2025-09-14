'use client';

import { useMemo } from 'react';
import { Button, Popconfirm, Space, Table, Tag, message } from 'antd';
import Link from 'next/link';

export interface GiftCodeDTO {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  max_uses: number;
  current_uses: number;
  created_date: string;
  expired_date?: string | null;
  is_active: boolean;
  player_limit_type: 'NONE' | 'SPECIFIC_PLAYERS' | 'EXCLUDE_PLAYERS' | 'VIP_ONLY';
  vip_level_min: number;
  items_count: number;
  options_count: number;
  restrictions_count: number;
  usage_count: number;
}

interface GiftcodeTableProps {
  dataSource: GiftCodeDTO[];
  loading?: boolean;
  pagination?: any;
  onUpdated?: () => void; // notify parent to refresh
}

export default function GiftcodeTable({ dataSource, loading, pagination, onUpdated }: GiftcodeTableProps) {

  const columns = useMemo(() => [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', width: 110, render: (v: boolean) => v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag> },
    { title: 'Giới hạn', dataIndex: 'player_limit_type', key: 'player_limit_type', width: 170 },
    { title: 'VIP min', dataIndex: 'vip_level_min', key: 'vip_level_min', width: 90 },
    { title: 'Uses', key: 'uses', width: 120, render: (_: any, r: GiftCodeDTO) => `${r.current_uses}/${r.max_uses || '∞'}` },
    { title: 'Hết hạn', dataIndex: 'expired_date', key: 'expired_date', width: 180, render: (d?: string | null) => d ? new Date(d).toLocaleString() : 'Không' },
    { title: 'Items', dataIndex: 'items_count', key: 'items_count', width: 90 },
    { title: 'Options', dataIndex: 'options_count', key: 'options_count', width: 90 },
    { title: 'Restr.', dataIndex: 'restrictions_count', key: 'restrictions_count', width: 90 },
    { title: 'Used', dataIndex: 'usage_count', key: 'usage_count', width: 90 },
    {
      title: 'Actions', key: 'actions', width: 200,
      render: (_: any, r: GiftCodeDTO) => (
        <Space>
          <Link href={`/giftcodes/${r.id}`}><Button size="small">Sửa</Button></Link>
          <Popconfirm
            title="Xóa giftcode này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => onDelete(r.id)}
          >
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    },
  ], []);

  async function onDelete(id: number) {
    try {
      const res = await fetch(`/api/giftcodes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa thất bại');
      message.success('Đã xóa giftcode');
      if (onUpdated) onUpdated();
    } catch (e: any) {
      message.error(e?.message || 'Lỗi khi xóa');
    }
  }

  // no-op

  return (
    <>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns as any}
        dataSource={dataSource}
        pagination={pagination}
      />
    </>
  );
}
