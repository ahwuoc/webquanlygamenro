'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Input, Select } from 'antd';
import GiftcodeTable from '@/components/GiftcodeTable';

interface GiftcodeRow {
  id: number;
  code: string;
  type: number;
  Delete: boolean;
  limit: number;
  listUser: string;
  listItem: string;
  bagCount: boolean;
  itemoption: string;
  active: number; // 0/1
}

export default function GiftcodesPage() {
  const [data, setData] = useState<GiftcodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [code, setCode] = useState('');
  const [type, setType] = useState<string>('all');
  const [active, setActive] = useState<'all' | '1' | '0'>('all');

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (code.trim()) params.set('code', code.trim());
    if (type !== 'all') params.set('type', type);
    if (active !== 'all') params.set('active', active);

    const res = await fetch(`/api/giftcodes?${params.toString()}`);
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
  }, [page, limit, type, active]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Giftcodes</h1>
            <p className="text-gray-600">Quản lý giftcode</p>
          </div>
          {/* Placeholder for future create page */}
          {/* <Button type="primary" href="/giftcodes/new">+ Thêm Giftcode</Button> */}
        </div>

        <Card title="Bộ lọc">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm">Mã code</label>
              <Input
                placeholder="Nhập code..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onPressEnter={() => { setPage(1); fetchData(); }}
              />
            </div>

            <div>
              <label className="text-sm">Loại (type)</label>
              <Select
                className="w-full"
                value={type}
                onChange={(v) => setType(v)}
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: '0', value: '0' },
                  { label: '1', value: '1' },
                  { label: '2', value: '2' },
                  { label: '3', value: '3' },
                ]}
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
                  { label: 'Active (1)', value: '1' },
                  { label: 'Inactive (0)', value: '0' },
                ]}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={() => { setPage(1); fetchData(); }}>Tìm</Button>
              <Button onClick={() => { setCode(''); setType('all'); setActive('all'); setPage(1); }}>Xóa lọc</Button>
            </div>
          </div>
        </Card>

        <Card>
          <GiftcodeTable
            dataSource={data}
            loading={loading}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              showSizeChanger: true,
              onChange: (p: number, ps: number) => { setPage(p); setLimit(ps); },
            }}
            onUpdated={() => {
              // re-fetch current page after successful update from modal
              fetchData();
            }}
          />
        </Card>
      </div>
    </div>
  );
}
