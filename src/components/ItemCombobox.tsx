"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Select, Button } from 'antd';

interface ItemRow {
  id: number;
  NAME: string;
  TYPE: number;
  part: number;
  gender: number;
  description: string;
}

export default function ItemCombobox({
  label = "Chọn Item",
  placeholder = "Chọn item...",
  value,
  onChange,
  typeFilter,
  items: externalItems,
  disabled,
  onRefresh,
}: {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  typeFilter?: number | null;
  items?: ItemRow[];
  disabled?: boolean;
  onRefresh?: () => void;
}) {
  const [items, setItems] = useState<ItemRow[]>(externalItems || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (externalItems) {
      setItems(typeof typeFilter === "number" ? externalItems.filter((x) => x.TYPE === typeFilter) : externalItems);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const resp = await fetch("/api/items?limit=all");
        if (resp.ok) {
          const data = await resp.json();
          let arr: ItemRow[] = data.items || [];
          if (typeof typeFilter === "number") arr = arr.filter((x: ItemRow) => x.TYPE === typeFilter);
          setItems(arr);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [typeFilter, externalItems]);

  const options = useMemo(
    () => items.map((it) => ({ label: `${it.NAME} (#${it.id})`, value: String(it.id), key: it.id })),
    [items]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label>{label}</label>
        {onRefresh && (
          <Button size="small" onClick={onRefresh} disabled={disabled}>
            Làm mới cache
          </Button>
        )}
      </div>
      <Select
        showSearch
        virtual
        allowClear
        placeholder={placeholder}
        value={value || undefined}
        onChange={(v) => onChange(v || '')}
        options={options}
        disabled={disabled}
        loading={loading}
        filterOption={(input, option) => {
          const label = (option?.label as string) || '';
          return label.toLowerCase().includes(input.toLowerCase());
        }}
        style={{ width: '100%' }}
      />
    </div>
  );
}
