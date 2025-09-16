'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Input, Select } from 'antd';
import GiftcodeTable, { type GiftCodeDTO } from '@/components/GiftcodeTable';
import Link from 'next/link';

type GiftcodeRow = GiftCodeDTO;

export default function GiftcodesPage() {
  const [data, setData] = useState<GiftCodeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [code, setCode] = useState('');
  const [active, setActive] = useState<'all' | '1' | '0'>('all');
  const [playerLimitType, setPlayerLimitType] = useState<'all' | GiftcodeRow['player_limit_type']>('all');
  const [expired, setExpired] = useState<'all' | 'yes' | 'no'>('all');

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (code.trim()) params.set('code', code.trim());
    if (active !== 'all') params.set('active', active);
    if (playerLimitType !== 'all') params.set('player_limit_type', playerLimitType);
    if (expired !== 'all') params.set('expired', expired);

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
  }, [page, limit, active, playerLimitType, expired]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Giftcodes</h1>
            <p className="text-gray-600">Quản lý giftcode</p>
          </div>
          <Link href="/giftcodes/new"><Button type="primary">+ Thêm Giftcode</Button></Link>
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
              <label className="text-sm">Giới hạn player</label>
              <Select
                className="w-full"
                value={playerLimitType}
                onChange={(v) => setPlayerLimitType(v as any)}
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: 'NONE', value: 'NONE' },
                  { label: 'SPECIFIC_PLAYERS', value: 'SPECIFIC_PLAYERS' },
                  { label: 'EXCLUDE_PLAYERS', value: 'EXCLUDE_PLAYERS' },
                  { label: 'VIP_ONLY', value: 'VIP_ONLY' },
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

            <div>
              <label className="text-sm">Hết hạn</label>
              <Select
                className="w-full"
                value={expired}
                onChange={setExpired}
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: 'Đã hết hạn', value: 'yes' },
                  { label: 'Chưa hết hạn/không hạn', value: 'no' },
                ]}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={() => { setPage(1); fetchData(); }}>Tìm</Button>
              <Button onClick={() => { setCode(''); setPlayerLimitType('all'); setActive('all'); setExpired('all'); setPage(1); }}>Xóa lọc</Button>
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
              fetchData();
            }}
          />
        </Card>
      </div>
    </div>
  );
}
