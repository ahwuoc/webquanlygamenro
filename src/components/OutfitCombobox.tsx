"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Select, Button } from "antd";

interface ItemRow {
  id: number;
  NAME: string;
  TYPE: number;
  part: number;
  gender: number;
  description: string;
}

export default function OutfitCombobox({
  label = "Chọn Trang Phục",
  placeholder = "Tìm tên hoặc ID trang phục...",
  value,
  onChange,
}: {
  label?: string;
  placeholder?: string;
  value: string; // outfit item_template id as string
  onChange: (val: string) => void;
}) {
  const [_open, _setOpen] = useState(false);
  const [_query, _setQuery] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const loadItems = async (refresh = false) => {
    setLoading(true);
    try {
      const url = `/api/items?limit=all${refresh ? "&refresh=1" : ""}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        const list: ItemRow[] = (data.items || []).filter((it: ItemRow) => it.TYPE === 5);
        setItems(list);
        if (data.pagination?.cachedAt) {
          setRefreshedAt(new Date(data.pagination.cachedAt).toLocaleString());
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(false);
  }, []);

  const options = useMemo(
    () => items.map((it) => ({ label: `${it.NAME} (#${it.id})`, value: String(it.id), key: it.id })),
    [items]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label>{label}</label>
        <Button size="small" onClick={() => loadItems(true)} disabled={loading}>
          {loading ? "Đang tải..." : "Làm mới cache items"}
        </Button>
      </div>
      {refreshedAt && (
        <div className="text-xs text-muted-foreground">Cache cập nhật: {refreshedAt}</div>
      )}
      <Select
        showSearch
        virtual
        allowClear
        placeholder={placeholder}
        value={value || undefined}
        onChange={(v) => onChange(v || '')}
        options={options}
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
