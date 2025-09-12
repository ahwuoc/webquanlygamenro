'use client';

import { useEffect, useMemo, useState } from 'react';
import { Select, Input, Button } from "antd";

interface ItemRow { id: number; NAME: string; TYPE: number; part: number; gender: number; description: string }

export default function ItemSelector({
  label = 'Chọn Item',
  placeholder = 'Chọn item...',
  value,
  onChange,
  typeFilter,
  items: externalItems,
}: {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  typeFilter?: number | null; // if provided, filters by TYPE
  items?: ItemRow[]; // if provided, component will not fetch internally
}) {
  const [items, setItems] = useState<ItemRow[]>(externalItems || []);
  const [loading, setLoading] = useState(false);
  const [isWarm, setIsWarm] = useState(!!externalItems);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const warmUpCache = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/items?refresh=1&limit=all');
      if (resp.ok) {
        const data = await resp.json();
        let arr: ItemRow[] = data.items || [];
        if (typeof typeFilter === 'number') arr = arr.filter((x: ItemRow) => x.TYPE === typeFilter);
        setItems(arr);
        setIsWarm(true);
        setCachedAt(data.pagination?.cachedAt || null);
      }
    } catch (e) {
      console.error('Warm cache failed', e);
    } finally {
      setLoading(false);
    }
  };

  // auto warm on first mount if not warmed yet
  useEffect(() => {
    if (externalItems) {
      // Controlled mode: just use provided items
      setItems(typeof typeFilter === 'number' ? externalItems.filter((x) => x.TYPE === typeFilter) : externalItems);
      setIsWarm(true);
      return;
    }
    // Uncontrolled mode: self load
    const load = async () => {
      setLoading(true);
      try {
        const resp = await fetch('/api/items?limit=all');
        if (resp.ok) {
          const data = await resp.json();
          let arr: ItemRow[] = data.items || [];
          if (typeof typeFilter === 'number') arr = arr.filter((x: ItemRow) => x.TYPE === typeFilter);
          setItems(arr);
          setIsWarm(true);
          setCachedAt(data.pagination?.cachedAt || null);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [typeFilter, externalItems]);

  const onSelect = (idStr: string) => {
    onChange(idStr);
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => it.NAME.toLowerCase().includes(s) || String(it.id).includes(s));
  }, [items, search]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label>{label}</label>
        {!externalItems && (
          <Button type="default" size="small" onClick={warmUpCache} disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới cache item'}
          </Button>
        )}
      </div>
      <Input placeholder="Tìm theo tên hoặc ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <Select
        value={value || undefined}
        onChange={onSelect}
        placeholder={placeholder}
        showSearch
        filterOption={(input, option) => {
          const label = option?.label as string || "";
          return label.toLowerCase().includes(input.toLowerCase());
        }}
        options={filtered.map((it) => ({
          label: `${it.NAME} (#${it.id})`,
          value: String(it.id),
          key: it.id
        }))}
        style={{ width: '100%' }}
      />
      {isWarm && (
        <p className="text-xs text-gray-500">Đã nạp {items.length} items • {cachedAt ? new Date(cachedAt).toLocaleString() : ''}</p>
      )}
    </div>
  );
}
