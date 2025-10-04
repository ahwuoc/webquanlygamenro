'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Input, Select, Space, Button, Typography, Modal, Form, InputNumber, Switch, message } from 'antd';
import ItemTable, { ItemRow } from '@/components/ItemTable';

interface ApiResponse {
  items: ItemRow[];
  types: { id: number; NAME: string }[];
  pagination: { page: number; limit: number; totalCount: number; totalPages: number; cachedAt: number };
}

export default function ItemsManagementPage() {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [types, setTypes] = useState<{ id: number; NAME: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<number | undefined>(undefined);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // modal state
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [editId, setEditId] = useState<number | null>(null);

  // bulk edit state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [_selectedRows, setSelectedRows] = useState<ItemRow[]>([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkForm] = Form.useForm();
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const fetchData = useCallback(async (opts?: { page?: number; pageSize?: number; search?: string; type?: number; refresh?: boolean }) => {
    const p = opts?.page ?? page;
    const l = opts?.pageSize ?? pageSize;
    const s = opts?.search ?? search;
    const t = opts?.type ?? selectedType;
    const refresh = opts?.refresh ? '1' : '0';

    const params = new URLSearchParams();
    params.set('page', String(p));
    params.set('limit', String(l));
    if (s) params.set('search', s);
    if (typeof t === 'number') params.set('type', String(t));
    if (refresh === '1') params.set('refresh', '1');

    setLoading(true);
    try {
      const res = await fetch(`/api/items?${params.toString()}`, { cache: 'no-store' });
      const data: ApiResponse = await res.json();
      setItems(data.items || []);
      setTypes(data.types || []);
      setTotal(data.pagination?.totalCount || 0);
      setPage(data.pagination?.page || 1);
      setPageSize(data.pagination?.limit || 20);
    } catch (e) {
      console.error('Failed to fetch items', e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedType]);

  useEffect(() => {
    fetchData({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeOptions = useMemo(() => (
    [{ value: undefined as unknown as number, label: 'Tất cả TYPE' }].concat(
      (types || []).map((t) => ({ value: t.id, label: `${t.id} - ${t.NAME}` }))
    )
  ), [types]);

  const onSearchApply = () => {
    fetchData({ page: 1, search, type: selectedType });
  };

  const onRefreshCache = () => {
    fetchData({ page: 1, search, type: selectedType, refresh: true });
  };

  const openCreate = () => {
    setEditId(null);
    form.resetFields();
    // defaults
    form.setFieldsValue({
      id: undefined,
      NAME: '',
      TYPE: 0,
      part: 0,
      gender: 3,
      description: '',
      icon_id: 0,
      power_require: 0,
      gold: 0,
      gem: 0,
      head: -1,
      body: -1,
      leg: -1,
      ruby: 0,
      is_up_to_up: false,
    });
    setOpen(true);
  };

  const openEdit = async (row: ItemRow) => {
    try {
      setEditId(row.id);
      setOpen(true);
      // fetch full item
      const res = await fetch(`/api/items/${row.id}`);
      const data = await res.json();
      form.setFieldsValue(data.item || row);
    } catch (e) {
      console.error(e);
      form.setFieldsValue(row);
    }
  };

  const openBulkEdit = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một item để sửa');
      return;
    }
    bulkForm.resetFields();
    setBulkEditOpen(true);
  };

  const handleBulkEdit = async () => {
    try {
      const values = await bulkForm.validateFields();
      setBulkSubmitting(true);
      
      // Only send fields that have values
      const updates: any = {};
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          updates[key] = values[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        message.warning('Vui lòng nhập ít nhất một trường để cập nhật');
        return;
      }

      const res = await fetch('/api/items/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedRowKeys,
          updates
        })
      });

      if (res.ok) {
        const data = await res.json();
        message.success(`Đã cập nhật ${data.updatedCount} item thành công`);
        setBulkEditOpen(false);
        setSelectedRowKeys([]);
        setSelectedRows([]);
        fetchData({ page });
      } else {
        message.error('Cập nhật hàng loạt thất bại');
      }
    } catch (e) {
      console.error(e);
      message.error('Có lỗi xảy ra khi cập nhật');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một item để xóa');
      return;
    }

    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} item đã chọn?`,
      onOk: async () => {
        try {
          const res = await fetch('/api/items/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedRowKeys })
          });

          if (res.ok) {
            const data = await res.json();
            message.success(`Đã xóa ${data.deletedCount} item thành công`);
            setSelectedRowKeys([]);
            setSelectedRows([]);
            fetchData({ page });
          } else {
            message.error('Xóa hàng loạt thất bại');
          }
        } catch (e) {
          console.error(e);
          message.error('Có lỗi xảy ra khi xóa');
        }
      }
    });
  };

  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      let ok = false;
      if (editId == null) {
        const res = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
        ok = res.ok;
      } else {
        const res = await fetch(`/api/items/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
        ok = res.ok;
      }
      if (ok) {
        message.success('Lưu item thành công');
        setOpen(false);
        fetchData({ page });
      } else {
        message.error('Lưu item thất bại');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Typography.Title level={2} style={{ margin: 0 }}>Item Management</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginTop: 4 }}>Quản lý item template, tìm kiếm theo tên/ID, lọc theo TYPE.</Typography.Paragraph>
        </div>

        <Card style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input.Search
              placeholder="Tìm theo tên hoặc ID..."
              allowClear
              enterButton="Tìm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={onSearchApply}
              style={{ width: 320 }}
            />
            <Select
              placeholder="Chọn TYPE"
              options={typeOptions}
              value={selectedType}
              onChange={(v) => setSelectedType(v)}
              style={{ minWidth: 220 }}
              allowClear
            />
            <Button type="primary" onClick={onSearchApply}>Áp dụng</Button>
            <Button onClick={onRefreshCache}>Làm mới cache</Button>
          </Space>
        </Card>

        <Card 
          title={`Danh Sách Item`} 
          extra={
            <Space>
              <span className="text-gray-600">Tổng: {total}</span>
              {selectedRowKeys.length > 0 && (
                <>
                  <span className="text-blue-600">Đã chọn: {selectedRowKeys.length}</span>
                  <Button onClick={openBulkEdit}>Sửa hàng loạt</Button>
                  <Button danger onClick={handleBulkDelete}>Xóa hàng loạt</Button>
                </>
              )}
              <Button type="primary" onClick={openCreate}>Thêm Item</Button>
            </Space>
          }
        >
          <ItemTable
            dataSource={items}
            loading={loading}
            onEdit={openEdit}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys, rows) => {
                setSelectedRowKeys(keys);
                setSelectedRows(rows);
              }
            }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
                fetchData({ page: p, pageSize: ps });
              },
            }}
          />
        </Card>

        <Modal
          title={editId == null ? 'Thêm Item' : `Chỉnh sửa Item #${editId}`}
          open={open}
          onCancel={() => setOpen(false)}
          onOk={submitForm}
          confirmLoading={submitting}
          width={720}
          destroyOnHidden
        >
          <Form
            layout="vertical"
            form={form}
          >
            <Form.Item label="ID" name="id" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <InputNumber style={{ width: '100%' }} disabled={editId != null} />
            </Form.Item>
            <Form.Item label="Tên Item (NAME)" name="NAME" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Input />
            </Form.Item>
            <Space size="middle" style={{ display: 'flex' }} wrap>
              <Form.Item label="TYPE" name="TYPE" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Part" name="part" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Gender" name="gender" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Space>
            <Form.Item label="Mô tả (description)" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Space size="middle" style={{ display: 'flex' }} wrap>
              <Form.Item label="Icon ID" name="icon_id" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Power Require" name="power_require" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Ruby" name="ruby" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Space>
            <Space size="middle" style={{ display: 'flex' }} wrap>
              <Form.Item label="Gold" name="gold" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Gem" name="gem" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="is_up_to_up" name="is_up_to_up" valuePropName="checked" style={{ flex: 1 }}>
                <Switch />
              </Form.Item>
            </Space>
            <Space size="middle" style={{ display: 'flex' }} wrap>
              <Form.Item label="Head" name="head" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Body" name="body" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Leg" name="leg" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Space>
          </Form>
        </Modal>

        <Modal
          title={`Sửa hàng loạt (${selectedRowKeys.length} item được chọn)`}
          open={bulkEditOpen}
          onCancel={() => setBulkEditOpen(false)}
          onOk={handleBulkEdit}
          confirmLoading={bulkSubmitting}
          width={720}
        >
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <Typography.Text type="secondary">
              Chỉ các trường được điền sẽ được cập nhật. Để trống các trường không muốn thay đổi.
            </Typography.Text>
          </div>
          <Form
            layout="vertical"
            form={bulkForm}
          >
            <Space size="middle" style={{ display: 'flex' }} wrap>
              <Form.Item label="TYPE" name="TYPE" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
              <Form.Item label="Part" name="part" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
              <Form.Item label="Gender" name="gender" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
            </Space>
            <Form.Item label="Mô tả (description)" name="description">
              <Input.TextArea rows={3} placeholder="Không thay đổi" />
            </Form.Item>
            <Space size="middle" style={{ display: 'flex' }} wrap>
              <Form.Item label="Icon ID" name="icon_id" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
              <Form.Item label="Power Require" name="power_require" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
              <Form.Item label="Ruby" name="ruby" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
            </Space>
            <Space size="middle" style={{ display: 'flex' }} wrap>
              <Form.Item label="Gold" name="gold" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
              <Form.Item label="Gem" name="gem" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
              <Form.Item label="is_up_to_up" name="is_up_to_up" valuePropName="checked" style={{ flex: 1 }}>
                <Switch />
              </Form.Item>
            </Space>
            <Space size="middle" style={{ display: 'flex' }} wrap>
              <Form.Item label="Head" name="head" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
              <Form.Item label="Body" name="body" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
              <Form.Item label="Leg" name="leg" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Không thay đổi" />
              </Form.Item>
            </Space>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
