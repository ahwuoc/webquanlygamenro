'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Card, InputNumber, Select, Table, Tag } from 'antd';

interface MobRewardRow {
  id: number;
  mob_id: number;
  item_id: number;
  quantity_min: number;
  quantity_max: number;
  drop_rate: number;
  map_restriction?: string | null;
  gender_restriction: number;
  option_id: number;
  option_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function MobRewardsListPage() {
  const [data, setData] = useState<MobRewardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [mobId, setMobId] = useState<number | undefined>(undefined);
  const [itemId, setItemId] = useState<number | undefined>(undefined);
  const [active, setActive] = useState<'all' | '1' | '0'>('all');

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (mobId !== undefined) params.set('mob_id', String(mobId));
    if (itemId !== undefined) params.set('item_id', String(itemId));
    if (active !== 'all') params.set('active', active);

    const res = await fetch(`/api/mob-rewards?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.pagination?.totalCount || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, mobId, itemId, active]);

  const columns = useMemo(() => [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Mob ID', dataIndex: 'mob_id', width: 100 },
    { title: 'Item ID', dataIndex: 'item_id', width: 100 },
    { title: 'Qty', key: 'qty', render: (_: any, r: MobRewardRow) => `${r.quantity_min}-${r.quantity_max}` },
    { title: 'Drop %', dataIndex: 'drop_rate', render: (v: number) => `${v}%` },
    { title: 'Map', dataIndex: 'map_restriction', render: (v: string | null) => v ?? '-' },
    { title: 'Gender', dataIndex: 'gender_restriction', render: (v: number) => (v === -1 ? 'All' : v) },
    { title: 'Option', key: 'option', render: (_: any, r: MobRewardRow) => `${r.option_id}:${r.option_level}` },
    { title: 'Active', dataIndex: 'is_active', render: (v: boolean) => v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag> },
    { title: 'Actions', key: 'actions', render: (_: any, r: MobRewardRow) => (
      <div className="flex gap-2">
        <Link href={`/mob-rewards/${r.id}/edit`}>Sửa</Link>
      </div>
    ) },
  ], []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mob Rewards</h1>
            <p className="text-gray-600">Quản lý drop item từ mob</p>
          </div>
          <Button type="primary" href="/mob-rewards/new">+ Thêm Mob Reward</Button>
        </div>

        <Card title="Bộ lọc">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm">Mob ID</label>
              <InputNumber className="w-full" min={1} value={mobId} onChange={(v) => setMobId(v ?? undefined)} />
            </div>
            <div>
              <label className="text-sm">Item ID</label>
              <InputNumber className="w-full" min={0} value={itemId} onChange={(v) => setItemId(v ?? undefined)} />
            </div>
            <div>
              <label className="text-sm">Trạng thái</label>
              <Select
                className="w-full"
                value={active}
                onChange={setActive}
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: 'Active', value: '1' },
                  { label: 'Inactive', value: '0' },
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => { setPage(1); fetchData(); }}>Làm mới</Button>
            </div>
          </div>
        </Card>

        <Card>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns as any}
            dataSource={data}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              showSizeChanger: true,
              onChange: (p, ps) => { setPage(p); setLimit(ps); },
            }}
          />
        </Card>
      </div>
    </div>
  );
}
