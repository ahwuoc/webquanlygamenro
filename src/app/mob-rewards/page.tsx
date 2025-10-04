'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Select, Table, Tag } from 'antd';

interface MobRewardRow {
  id: number;
  mob_id: number;
  // Back-compat flattened fields from API (first item)
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
  // New: full items in group
  items?: {
    id: number;
    item_id: number;
    quantity_min: number;
    quantity_max: number;
    drop_rate: number;
    options?: { id: number; option_id: number; param: number }[];
  }[];
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
  const [mobs, setMobs] = useState<{ id: number; NAME: string }[]>([]);
  const [items, setItems] = useState<{ id: number; NAME: string }[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

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

  // Load meta (mobs and items) for name mapping and filters
  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        const [mobsRes, itemsRes] = await Promise.all([
          fetch('/api/mobs?limit=all'),
          fetch('/api/items?limit=all'),
        ]);
        if (!cancelled) {
          if (mobsRes.ok) {
            const m = await mobsRes.json();
            if (Array.isArray(m)) setMobs(m);
          }
          if (itemsRes.ok) {
            const it = await itemsRes.json();
            if (Array.isArray(it)) {
              setItems(it);
            } else if (Array.isArray(it?.items)) {
              setItems(it.items);
            }
          }
          // removed unused option templates fetch
        }
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    };
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  const mobNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const x of mobs) m.set(x.id, x.NAME);
    return m;
  }, [mobs]);
  const itemNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const x of items) m.set(x.id, x.NAME);
    return m;
  }, [items]);

  const columns = useMemo(() => [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: 'Mob',
      key: 'mob',
      render: (_: any, r: MobRewardRow) => {
        const name = mobNameById.get(r.mob_id) || `#${r.mob_id}`;
        return (
          <div className="flex flex-col">
            <span>{name}</span>
            <span className="text-xs text-gray-500">ID: {r.mob_id}</span>
          </div>
        );
      },
    },
    {
      title: 'Items',
      key: 'items',
      render: (_: any, r: MobRewardRow) => {
        const items = Array.isArray(r.items) && r.items.length > 0
          ? r.items
          : [
            {
              id: -1,
              item_id: r.item_id,
              quantity_min: r.quantity_min,
              quantity_max: r.quantity_max,
              drop_rate: r.drop_rate,
              options: r.option_id || r.option_level ? [{ id: -1, option_id: r.option_id, param: r.option_level }] : [],
            },
          ];
        return (
          <div className="space-y-1">
            {items.map((it, idx) => {
              const name = itemNameById.get(it.item_id) || `#${it.item_id}`;
              const optCount = (it.options?.length || 0);
              return (
                <div key={`${r.id}-${it.id}-${idx}`} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{name}</span>
                  <span className="text-gray-500">(ID: {it.item_id})</span>
                  <span>• Qty {it.quantity_min}-{it.quantity_max}</span>
                  <span>• Drop {it.drop_rate.toFixed(1)}%</span>
                  {optCount > 0 && (
                    <span className="text-gray-500">• {optCount} opt</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      },
    },
    { title: 'Map', dataIndex: 'map_restriction', render: (v: string | null) => v ?? '-' },
    {
      title: 'Planet', dataIndex: 'gender_restriction', render: (v: number) => {
        if (v === -1) return 'Không giới hạn';
        if (v === 0) return 'Trái Đất (0)';
        if (v === 1) return 'Namek (1)';
        if (v === 2) return 'Xayda (2)';
        return String(v);
      }
    },
    // Keep legacy first-option info minimal; detailed options are summarized per item above
    { title: 'Active', dataIndex: 'is_active', render: (v: boolean) => v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag> },
    {
      title: 'Actions', key: 'actions', render: (_: any, r: MobRewardRow) => (
        <div className="flex gap-2">
          <Link href={`/mob-rewards/${r.id}/edit`}>Sửa</Link>
        </div>
      )
    },
  ], [itemNameById, mobNameById]);

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
              <label className="text-sm">Mob</label>
              <Select
                className="w-full"
                placeholder={loadingMeta ? 'Đang tải...' : 'Chọn mob'}
                loading={loadingMeta}
                allowClear
                showSearch
                optionFilterProp="label"
                value={mobId !== undefined ? String(mobId) : undefined}
                onChange={(v) => setMobId(v ? parseInt(String(v), 10) : undefined)}
                options={mobs.map((m) => ({ label: `${m.NAME} (#${m.id})`, value: String(m.id) }))}
              />
            </div>
            <div>
              <label className="text-sm">Item</label>
              <Select
                className="w-full"
                placeholder={loadingMeta ? 'Đang tải...' : 'Chọn item'}
                loading={loadingMeta}
                allowClear
                showSearch
                optionFilterProp="label"
                value={itemId !== undefined ? String(itemId) : undefined}
                onChange={(v) => setItemId(v ? parseInt(String(v), 10) : undefined)}
                options={items.map((it) => ({ label: `${it.NAME} (#${it.id})`, value: String(it.id) }))}
              />
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
            <div className="flex items-end gap-2">
              <Button onClick={() => { setPage(1); fetchData(); }}>Làm mới</Button>
              <Button onClick={() => { setMobId(undefined); setItemId(undefined); setActive('all'); setPage(1); }}>Xóa lọc</Button>
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
