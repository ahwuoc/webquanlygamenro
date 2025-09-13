'use client';

import { useEffect, useMemo, useState } from 'react';
import { Select } from "antd";

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
  typeFilter?: number | null;
  items?: ItemRow[];
}) {
  const [fullItems, setFullItems] = useState<ItemRow[]>(externalItems || []);
  const [loading, setLoading] = useState(false);
  const [isWarm, setIsWarm] = useState(!!externalItems);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  // auto warm on first mount if not warmed yet
  useEffect(() => {
    if (externalItems) {
      // Controlled mode: just use provided items
      setFullItems(externalItems);
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
          const arr: ItemRow[] = data.items || [];
          setFullItems(arr);
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

  // Only apply TYPE filter; use Antd Select's built-in search for text filtering
  const baseItems = useMemo(() => (
    typeof typeFilter === 'number' ? fullItems.filter((x) => x.TYPE === typeFilter) : fullItems
  ), [fullItems, typeFilter]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label>{label}</label>
      </div>
      <Select
        value={value || undefined}
        onChange={onSelect}
        placeholder={placeholder}
        showSearch
        filterOption={(input, option) => {
          const label = option?.label as string || "";
          return label.toLowerCase().includes(input.toLowerCase());
        }}
        options={baseItems.map((it) => ({
          label: `${it.NAME} (#${it.id})`,
          value: String(it.id),
          key: it.id
        }))}
        style={{ width: '100%' }}
        loading={loading}
      />
      {isWarm && (
        <p className="text-xs text-gray-500">
          Đã nạp: {baseItems.length}/{fullItems.length} items{typeof typeFilter === 'number' ? ` • Loại (TYPE): ${typeFilter}` : ''}
          {cachedAt ? ` • Cập nhật: ${new Date(cachedAt).toLocaleString()}` : ''}
        </p>
      )}
    </div>
  );
}
