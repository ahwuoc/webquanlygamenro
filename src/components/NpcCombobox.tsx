"use client";

import * as React from "react";
import { useMemo } from "react";
import { Select } from "antd";

export type NpcRow = {
  id: number;
  NAME: string;
};

export default function NpcCombobox({
  label = "Chọn NPC",
  placeholder = "Tìm theo tên hoặc ID...",
  items,
  value,
  onChange,
  disabled,
}: {
  label?: string;
  placeholder?: string;
  items: NpcRow[];
  value?: string; // id as string
  onChange?: (val: string) => void;
  disabled?: boolean;
}) {
  const options = useMemo(
    () => (items || []).map((it) => ({ label: `${it.NAME} (#${it.id})`, value: String(it.id), key: it.id })),
    [items]
  );

  return (
    <div className="space-y-2">
      <label>{label}</label>
      <Select
        showSearch
        virtual
        allowClear
        placeholder={placeholder}
        value={value || undefined}
        onChange={(v) => onChange?.(v || "")}
        options={options}
        disabled={disabled}
        filterOption={(input, option) => {
          const label = (option?.label as string) || "";
          return label.toLowerCase().includes(input.toLowerCase());
        }}
        style={{ width: '100%' }}
      />
    </div>
  );
}
