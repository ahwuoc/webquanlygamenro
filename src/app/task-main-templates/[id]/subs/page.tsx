'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';

interface TaskSubTemplate {
  id: number;
  task_main_id: number;
  NAME: string;
  max_count: number;
  notify: string;
  npc_id: number;
  map?: number;
}

export default function TaskSubTemplatesByMainPage() {
  const params = useParams();
  const mainId = useMemo(() => {
    const raw = params?.id;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = parseInt(String(v || ''), 10);
    return Number.isFinite(n) ? n : undefined;
  }, [params]);

  const [data, setData] = useState<TaskSubTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<TaskSubTemplate | null>(null);
  const [form] = Form.useForm<TaskSubTemplate>();

  // Meta for NPCs and Maps
  const [npcOptions, setNpcOptions] = useState<{ id: number; NAME: string }[]>([]);
  const [mapOptions, setMapOptions] = useState<{ id: number; NAME: string }[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const fetchData = async () => {
    if (!mainId) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('task_main_id', String(mainId));
    if (search.trim()) params.set('search', search.trim());
    const res = await fetch(`/api/task-sub-templates?${params.toString()}`);
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
  }, [mainId, page, limit, search]);

  // Load NPCs and Maps meta once
  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        const [npcsRes, mapsRes] = await Promise.all([
          fetch('/api/npcs?limit=all'),
          fetch('/api/maps?limit=all'),
        ]);
        if (!cancelled) {
          if (npcsRes.ok) {
            const n = await npcsRes.json();
            const arr = Array.isArray(n) ? n : Array.isArray(n?.npcs) ? n.npcs : [];
            setNpcOptions(arr);
          }
          if (mapsRes.ok) {
            const m = await mapsRes.json();
            const arr = Array.isArray(m) ? m : Array.isArray(m?.maps) ? m.maps : [];
            setMapOptions(arr);
          }
        }
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    };
    loadMeta();
    return () => { cancelled = true; };
  }, []);

  function onCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ task_main_id: mainId } as any);
    setOpen(true);
  }
  function onEdit(row: TaskSubTemplate) {
    setEditing(row);
    form.setFieldsValue(row);
    setOpen(true);
  }
  async function onDelete(id: number) {
    const res = await fetch(`/api/task-sub-templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      message.success('Đã xóa');
      fetchData();
    } else {
      message.error('Xóa thất bại');
    }
  }

  async function handleOk() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        const res = await fetch(`/api/task-sub-templates/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_main_id: values.task_main_id,
            NAME: values.NAME,
            max_count: values.max_count,
            notify: values.notify,
            npc_id: typeof values.npc_id === 'string' ? parseInt(values.npc_id, 10) : values.npc_id,
            map: typeof values.map === 'string' ? parseInt(values.map, 10) : values.map,
          }),
        });
        if (!res.ok) throw new Error('Cập nhật thất bại');
        message.success('Đã cập nhật');
      } else {
        const res = await fetch(`/api/task-sub-templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_main_id: values.task_main_id,
            NAME: values.NAME,
            max_count: values.max_count,
            notify: values.notify,
            npc_id: typeof values.npc_id === 'string' ? parseInt(values.npc_id, 10) : values.npc_id,
            map: typeof values.map === 'string' ? parseInt(values.map, 10) : values.map,
          }),
        });
        if (!res.ok) throw new Error('Tạo mới thất bại');
        message.success('Đã tạo mới');
      }
      setOpen(false);
      fetchData();
    } catch (e: any) {
      if (e?.message) message.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const npcNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const n of npcOptions) m.set(n.id, n.NAME);
    return m;
  }, [npcOptions]);
  const mapNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const mp of mapOptions) m.set(mp.id, mp.NAME);
    return m;
  }, [mapOptions]);

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Tên (NAME)', dataIndex: 'NAME' },
    { title: 'Max Count', dataIndex: 'max_count', width: 110 },
    { title: 'Notify', dataIndex: 'notify' },
    {
      title: 'NPC', dataIndex: 'npc_id', width: 220,
      render: (id: number) => {
        const name = npcNameById.get(id);
        return name ? (
          <div className="flex flex-col">
            <span>{name}</span>
            <span className="text-xs text-gray-500">ID: {id}</span>
          </div>
        ) : `#${id}`;
      }
    },
    {
      title: 'Map', dataIndex: 'map', width: 220,
      render: (id?: number) => {
        if (id === undefined || id === null) return '-';
        const name = mapNameById.get(id);
        return name ? (
          <div className="flex flex-col">
            <span>{name}</span>
            <span className="text-xs text-gray-500">ID: {id}</span>
          </div>
        ) : `#${id}`;
      }
    },
    {
      title: 'Hành động', key: 'actions', width: 180,
      render: (_: any, r: TaskSubTemplate) => (
        <Space>
          <Button size="small" onClick={() => onEdit(r)}>Sửa</Button>
          <Popconfirm title="Xóa task con này?" okText="Xóa" cancelText="Hủy" onConfirm={() => onDelete(r.id)}>
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Task Sub Templates</h1>
            <p className="text-gray-600">Main ID: {mainId ?? '-'}</p>
          </div>
          <Space>
            <Input placeholder="Tìm theo tên" value={search} onChange={(e) => setSearch(e.target.value)} onPressEnter={() => { setPage(1); fetchData(); }} />
            <Button type="primary" onClick={onCreate} disabled={!mainId}>+ Thêm Sub</Button>
          </Space>
        </div>

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

        <Modal
          open={open}
          title={editing ? 'Sửa Task Sub Template' : 'Thêm Task Sub Template'}
          onCancel={() => setOpen(false)}
          onOk={handleOk}
          confirmLoading={saving}
        >
          <Form form={form} layout="vertical" initialValues={{ task_main_id: mainId, max_count: -1, npc_id: -1, map: 0 }}>
            <Form.Item label="Task Main ID" name="task_main_id" rules={[{ required: true, message: 'Nhập task_main_id' }]}>
              <InputNumber min={1} className="w-full" />
            </Form.Item>
            <Form.Item label="Tên (NAME)" name="NAME" rules={[{ required: true, message: 'Nhập NAME' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Max Count" name="max_count" rules={[{ required: true, message: 'Nhập max_count' }]}>
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item label="Notify" name="notify">
              <Input />
            </Form.Item>
            <Form.Item label="NPC" name="npc_id" rules={[{ required: true, message: 'Chọn NPC' }]}>
              <Select
                className="w-full"
                showSearch
                loading={loadingMeta}
                placeholder={loadingMeta ? 'Đang tải NPC...' : 'Chọn NPC'}
                optionFilterProp="label"
                options={npcOptions.map(n => ({ label: `${n.NAME} (#${n.id})`, value: String(n.id) }))}
              />
            </Form.Item>
            <Form.Item label="Map (tuỳ chọn)" name="map">
              <Select
                className="w-full"
                showSearch
                loading={loadingMeta}
                placeholder={loadingMeta ? 'Đang tải Map...' : 'Chọn Map'}
                optionFilterProp="label"
                options={mapOptions.map(m => ({ label: `${m.NAME} (#${m.id})`, value: String(m.id) }))}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
