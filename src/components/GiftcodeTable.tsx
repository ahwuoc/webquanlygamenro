'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Divider, Form, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message, Typography, Input } from 'antd';

const { Text } = Typography;
const { TextArea } = Input;

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

interface GiftcodeTableProps {
  dataSource: GiftcodeRow[];
  loading?: boolean;
  pagination?: any;
  onUpdated?: () => void; // notify parent to refresh
}

function normalizeJsonArray(input: string): string {
  try {
    // quick fix for patterns like {"id":30"param":0} -> {"id":30,"param":0}
    let fixed = input.replace(/"id"\s*:\s*(\d+)\s*"param"/g, '"id":$1,"param"');
    // Ensure it's an array string; if single object, wrap into array
    const trimmed = fixed.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      fixed = `[${fixed}]`;
    }
    // Try parse to validate
    const parsed = JSON.parse(fixed);
    if (!Array.isArray(parsed)) return JSON.stringify([parsed], null, 2);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return input; // return original if still invalid; UI will show error later
  }
}

export default function GiftcodeTable({ dataSource, loading, pagination, onUpdated }: GiftcodeTableProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<GiftcodeRow | null>(null);
  const [listItemText, setListItemText] = useState(''); // legacy textarea fallback
  const [itemOptionText, setItemOptionText] = useState('');

  // meta
  const [itemsMeta, setItemsMeta] = useState<{ id: number; NAME: string }[]>([]);
  const [optionMeta, setOptionMeta] = useState<{ id: number; NAME: string }[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // structured editors
  type ItemRow = { id?: number; quantity?: number };
  type OptionRow = { id?: number; param?: number };
  const [itemRows, setItemRows] = useState<ItemRow[]>([]);
  const [optionRows, setOptionRows] = useState<OptionRow[]>([]);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        const [itemsRes, optsRes] = await Promise.all([
          fetch('/api/items?limit=all'),
          fetch('/api/item-options'),
        ]);
        if (!cancelled) {
          if (itemsRes.ok) {
            const it = await itemsRes.json();
            setItemsMeta(Array.isArray(it?.items) ? it.items : Array.isArray(it) ? it : []);
          }
          if (optsRes.ok) {
            const om = await optsRes.json();
            setOptionMeta(Array.isArray(om) ? om : []);
          }
        }
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    };
    loadMeta();
    return () => { cancelled = true; };
  }, []);

  const columns = useMemo(() => [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 80 },
    { title: 'Active', dataIndex: 'active', key: 'active', width: 100, render: (v: number) => v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag> },
    { title: 'Delete?', dataIndex: 'Delete', key: 'Delete', width: 100, render: (v: boolean) => v ? 'Yes' : 'No' },
    { title: 'Limit', dataIndex: 'limit', key: 'limit', width: 90 },
    { title: 'Bag Check', dataIndex: 'bagCount', key: 'bagCount', width: 110, render: (v: boolean) => v ? 'Yes' : 'No' },
    {
      title: 'Actions', key: 'actions', width: 160,
      render: (_: any, r: GiftcodeRow) => (
        <Space>
          <Button size="small" onClick={() => onEdit(r)}>Sửa Items</Button>
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

  function onEdit(row: GiftcodeRow) {
    setCurrent(row);
    const li = normalizeJsonArray(row.listItem || '[]');
    const io = normalizeJsonArray(row.itemoption || '[]');
    setListItemText(li);
    setItemOptionText(io);
    // try parse into rows
    try {
      const parsedItems = JSON.parse(li);
      setItemRows(Array.isArray(parsedItems) ? parsedItems.map((x: any) => ({ id: Number(x.id), quantity: Number(x.quantity) })) : []);
    } catch { setItemRows([]); }
    try {
      const parsedOpts = JSON.parse(io);
      setOptionRows(Array.isArray(parsedOpts) ? parsedOpts.map((x: any) => ({ id: Number(x.id), param: Number(x.param) })) : []);
    } catch { setOptionRows([]); }
    setOpen(true);
  }

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

  async function handleSave() {
    if (!current) return;
    try {
      // Prefer structured rows; fallback to textarea if rows empty
      let items = itemRows.filter(r => r.id && r.quantity && r.quantity! >= 0).map(r => ({ id: r.id!, quantity: r.quantity! }));
      let opts = optionRows.filter(r => r.id !== undefined && r.param !== undefined).map(r => ({ id: r.id!, param: r.param! }));
      if (items.length === 0) {
        const parsed = JSON.parse(listItemText);
        if (!Array.isArray(parsed)) throw new Error('listItem phải là mảng');
        items = parsed;
      }
      if (opts.length === 0) {
        const parsed = JSON.parse(itemOptionText);
        if (!Array.isArray(parsed)) throw new Error('itemoption phải là mảng');
        opts = parsed;
      }

      setSaving(true);
      const res = await fetch(`/api/giftcodes/${current.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listItem: JSON.stringify(items), itemoption: JSON.stringify(opts) }),
      });
      if (!res.ok) throw new Error('Cập nhật thất bại');
      message.success('Đã lưu thay đổi');
      setOpen(false);
      if (onUpdated) onUpdated();
    } catch (e: any) {
      message.error(e?.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns as any}
        dataSource={dataSource}
        pagination={pagination}
      />

      <Modal
        open={open}
        title={
          <div className="space-y-1">
            <div className="text-lg font-semibold">Sửa Items cho Giftcode</div>
            {current && <Text type="secondary">ID: {current.id} • Code: {current.code}</Text>}
          </div>
        }
        onCancel={() => setOpen(false)}
        okText="Lưu"
        confirmLoading={saving}
        onOk={handleSave}
        width={800}
      >
        <div className="space-y-4">
          <div>
            <div className="mb-2 font-medium">Danh sách Item (id + quantity)</div>
            <Space direction="vertical" className="w-full">
              {itemRows.map((row, idx) => (
                <Space key={idx} className="w-full" wrap>
                  <Select
                    className="min-w-[280px]"
                    showSearch
                    placeholder={loadingMeta ? 'Đang tải items...' : 'Chọn item'}
                    loading={loadingMeta}
                    value={row.id !== undefined ? String(row.id) : undefined}
                    onChange={(v) => {
                      const id = parseInt(String(v), 10);
                      setItemRows((prev) => prev.map((r, i) => i === idx ? { ...r, id } : r));
                    }}
                    optionFilterProp="label"
                    options={itemsMeta.map((it) => ({ label: `${it.NAME} (#${it.id})`, value: String(it.id) }))}
                  />
                  <InputNumber
                    min={0}
                    placeholder="Số lượng"
                    value={row.quantity}
                    onChange={(q) => setItemRows((prev) => prev.map((r, i) => i === idx ? { ...r, quantity: Number(q) } : r))}
                  />
                  <Button danger onClick={() => setItemRows((prev) => prev.filter((_, i) => i !== idx))}>Xóa</Button>
                </Space>
              ))}
              <Button onClick={() => setItemRows((prev) => [...prev, { id: undefined, quantity: 1 }])}>+ Thêm item</Button>
            </Space>
          </div>

          <Divider />

          <div>
            <div className="mb-2 font-medium">Danh sách Option (id + param)</div>
            <Space direction="vertical" className="w-full">
              {optionRows.map((row, idx) => (
                <Space key={idx} className="w-full" wrap>
                  <Select
                    className="min-w-[280px]"
                    showSearch
                    placeholder={loadingMeta ? 'Đang tải options...' : 'Chọn option'}
                    loading={loadingMeta}
                    value={row.id !== undefined ? String(row.id) : undefined}
                    onChange={(v) => {
                      const id = parseInt(String(v), 10);
                      setOptionRows((prev) => prev.map((r, i) => i === idx ? { ...r, id } : r));
                    }}
                    optionFilterProp="label"
                    options={optionMeta.map((op) => ({ label: `${op.NAME} (#${op.id})`, value: String(op.id) }))}
                  />
                  <InputNumber
                    placeholder="Param"
                    value={row.param}
                    onChange={(p) => setOptionRows((prev) => prev.map((r, i) => i === idx ? { ...r, param: Number(p) } : r))}
                  />
                  <Button danger onClick={() => setOptionRows((prev) => prev.filter((_, i) => i !== idx))}>Xóa</Button>
                </Space>
              ))}
              <Button onClick={() => setOptionRows((prev) => [...prev, { id: undefined, param: 0 }])}>+ Thêm option</Button>
            </Space>
          </div>

          <Divider />

          <Button type="link" onClick={() => setShowRaw(!showRaw)}>
            {showRaw ? 'Ẩn JSON thô' : 'Hiển thị JSON thô (nâng cao)'}
          </Button>
          {showRaw && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-1 font-medium">listItem (JSON)</div>
                <TextArea
                  value={listItemText}
                  onChange={(e) => setListItemText(e.target.value)}
                  autoSize={{ minRows: 6 }}
                  spellCheck={false}
                />
              </div>
              <div>
                <div className="mb-1 font-medium">itemoption (JSON)</div>
                <TextArea
                  value={itemOptionText}
                  onChange={(e) => setItemOptionText(e.target.value)}
                  autoSize={{ minRows: 6 }}
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Gợi ý: Bạn có thể dùng Select để chọn nhanh item/option. Nếu dữ liệu cũ sai JSON, bật "Hiển thị JSON thô" để sửa trực tiếp.
          </div>
        </div>
      </Modal>
    </>
  );
}
