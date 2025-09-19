"use client";

import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Card, Space, Button, Checkbox, Input, Modal, Select, Form, message, Switch } from 'antd';
import ItemCombobox from '@/components/ItemCombobox';
import IconSelector from '@/components/IconSelector';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = useMemo(() => (params?.id ? Number(params.id) : 0), [params]);

  const { data: detail, mutate: mutateDetail } = useSWR(
    shopId ? `/api/shops/${shopId}` : null,
    fetcher
  );

  const [selectedTab, setSelectedTab] = useState<number | null>(null);
  const tabs = useMemo(() => detail?.tabs || [], [detail?.tabs]);

  useEffect(() => {
    if (!selectedTab && tabs.length) setSelectedTab(tabs[0].id);
  }, [tabs, selectedTab]);

  const { data: itemData, mutate: mutateItems, isLoading: loadingItems } = useSWR(
    selectedTab ? `/api/shop-items?tab_id=${selectedTab}&page=1&limit=100` : null,
    fetcher
  );
  const { data: typeSellList } = useSWR('/api/type-sell', fetcher);
  const { data: allItems, mutate: mutateAllItems, isLoading: loadingAllItems } = useSWR('/api/items?limit=all', fetcher);
  const [itemsCacheRefreshedAt, setItemsCacheRefreshedAt] = useState<string | null>(null);
  const [isRefreshingItems, setIsRefreshingItems] = useState(false);

  // Options management state
  const [optModalOpen, setOptModalOpen] = useState(false);
  const [optItemId, setOptItemId] = useState<number | null>(null);
  const { data: optionTemplates } = useSWR('/api/item-options', fetcher);
  const { data: itemOptions, mutate: mutateItemOptions } = useSWR(
    optItemId ? `/api/shop-item-options?item_shop_id=${optItemId}` : null,
    fetcher
  );
  const [newOptionId, setNewOptionId] = useState<string>('');
  const [newOptionParam, setNewOptionParam] = useState<string>('0');

  // Edit item state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTempId, setEditTempId] = useState('');
  const [editTypeSell, setEditTypeSell] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editIconSpec, setEditIconSpec] = useState<number>(0);
  const [editIsNew, setEditIsNew] = useState(true);
  const [editIsSell, setEditIsSell] = useState(true);
  const [editForm] = Form.useForm();

  // Create Tab
  const [newTabName, setNewTabName] = useState('');
  const onCreateTabFinish = async () => {
    if (!newTabName) return;
    const res = await fetch('/api/shop-tabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_id: shopId, NAME: newTabName }),
    });
    if (res.ok) {
      setNewTabName('');
      await mutateDetail();
    }
  };

  const refreshItemsCache = async () => {
    try {
      setIsRefreshingItems(true);
      await fetch('/api/items?refresh=1&limit=all');
      await mutateAllItems();
      const now = Date.now();
      try {
        localStorage.setItem('items_cache_refreshed_at', String(now));
        setItemsCacheRefreshedAt(new Date(now).toLocaleString());
      } catch { }
    } catch {
      // noop
    } finally {
      setIsRefreshingItems(false);
    }
  };

  // load last refresh time from localStorage once
  useEffect(() => {
    try {
      const ts = localStorage.getItem('items_cache_refreshed_at');
      if (ts) setItemsCacheRefreshedAt(new Date(Number(ts)).toLocaleString());
    } catch { }
  }, []);

  const onRenameTab = async (id: number, name: string) => {
    const res = await fetch(`/api/shop-tabs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NAME: name }),
    });
    if (res.ok) await mutateDetail();
  };

  const onDeleteTab = async (id: number) => {
    if (!confirm('Xóa tab này?')) return;
    const res = await fetch(`/api/shop-tabs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await mutateDetail();
      setSelectedTab((prev) => (prev === id ? null : prev));
    }
  };

  // Add Item to Tab
  const [tempId, setTempId] = useState('');
  const [typeSell, setTypeSell] = useState('1');
  const [cost, setCost] = useState('0');
  const [isNew, setIsNew] = useState(true);
  const [isSell, setIsSell] = useState(true);

  const onAddItemFinish = async () => {
    if (!selectedTab || !tempId) return;
    const res = await fetch('/api/shop-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tab_id: selectedTab,
        temp_id: Number(tempId),
        is_new: isNew,
        is_sell: isSell,
        type_sell: typeSell ? Number(typeSell) : undefined,
        cost: cost ? Number(cost) : undefined,
      }),
    });
    if (res.ok) {
      setTempId('');
      await mutateItems();
    }
  };

  const onDeleteItem = async (id: number) => {
    if (!confirm('Xóa item này khỏi tab?')) return;
    const res = await fetch(`/api/shop-items/${id}`, { method: 'DELETE' });
    if (res.ok) await mutateItems();
  };

  const openOptions = (itemId: number) => {
    setOptItemId(itemId);
    setOptModalOpen(true);
  };

  const addItemOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optItemId || !newOptionId) return;
    const res = await fetch('/api/shop-item-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_shop_id: optItemId, option_id: Number(newOptionId), param: Number(newOptionParam || 0) }),
    });
    if (res.ok) {
      setNewOptionId('');
      setNewOptionParam('0');
      await mutateItemOptions();
    }
  };

  const updateItemOption = async (option_id: number, param: number) => {
    if (!optItemId) return;
    const res = await fetch('/api/shop-item-options', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_shop_id: optItemId, option_id, param }),
    });
    if (res.ok) await mutateItemOptions();
  };

  const deleteItemOption = async (option_id: number) => {
    if (!optItemId) return;
    const res = await fetch('/api/shop-item-options', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_shop_id: optItemId, option_id }),
    });
    if (res.ok) await mutateItemOptions();
  };

  const openEdit = (it: any) => {
    setEditId(it.id);
    setEditTempId(String(it.temp_id));
    setEditTypeSell(it.type_sell ? String(it.type_sell) : '');
    setEditCost(it.cost ? String(it.cost) : '');
    setEditIconSpec(it.icon_spec || 0);
    setEditIsNew(!!it.is_new);
    setEditIsSell(!!it.is_sell);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      const res = await fetch(`/api/shop-items/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp_id: editTempId ? Number(editTempId) : undefined,
          type_sell: editTypeSell ? Number(editTypeSell) : undefined,
          cost: editCost !== '' ? Number(editCost) : undefined,
          icon_spec: editIconSpec || undefined,
          is_new: editIsNew,
          is_sell: editIsSell,
        }),
      });
      if (res.ok) {
        message.success('Cập nhật item thành công!');
        setEditOpen(false);
        await mutateItems();
      } else {
        message.error('Có lỗi xảy ra khi cập nhật item');
      }
    } catch {
      message.error('Có lỗi xảy ra khi cập nhật item');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Quản lý Shop #{shopId}</h1>
          <Button onClick={() => router.push('/shop')}>Trở về</Button>
        </div>

        {/* Tabs Manager */}
        <Card title="Tabs">
          <div className="flex flex-wrap gap-2 mb-4">
            {tabs.map((t: any) => (
              <div key={t.id} className={`px-3 py-2 rounded border ${selectedTab === t.id ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
                <button className="font-medium mr-2" onClick={() => setSelectedTab(t.id)}>{t.NAME}</button>
                <Button size="small" onClick={async () => {
                  const name = prompt('Tên tab mới', t.NAME || '');
                  if (name !== null) await onRenameTab(t.id, name);
                }}>Sửa</Button>
                <Button size="small" className="ml-2" onClick={() => onDeleteTab(t.id)}>Xóa</Button>
              </div>
            ))}
          </div>

          <Form layout="inline" onFinish={onCreateTabFinish} className="flex items-end gap-3">
            <Form.Item label="Tên tab mới" className="!mb-0">
              <Input value={newTabName} onChange={(e) => setNewTabName(e.target.value)} placeholder="VD: Vũ khí" required />
            </Form.Item>
            <Form.Item className="!mb-0">
              <Button htmlType="submit" type="primary">Thêm Tab</Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Items in selected tab */}
        {selectedTab && (
          <Card title={`Items trong tab #${selectedTab}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Quản lý item bán trong tab
                {itemsCacheRefreshedAt && (
                  <span className="ml-3 text-xs text-muted-foreground">Cache cập nhật: {itemsCacheRefreshedAt}</span>
                )}
              </div>
              <Button type="default" size="small" onClick={refreshItemsCache} disabled={isRefreshingItems}>
                {isRefreshingItems ? 'Đang tải...' : 'Làm mới cache items'}
              </Button>
            </div>

            <Form layout="vertical" className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-6" onFinish={onAddItemFinish}>
              <Form.Item className="!mb-0 md:col-span-2">
                <ItemCombobox label="Item bán (item_template)" placeholder="Tìm tên hoặc ID..." items={allItems?.items || []} value={tempId} onChange={setTempId} disabled={loadingAllItems || isRefreshingItems} />
              </Form.Item>
              <Form.Item label="Type Sell" className="!mb-0">
                <Select
                  value={typeSell || undefined}
                  onChange={(v) => setTypeSell(String(v))}
                  placeholder="Chọn Type Sell"
                  options={(typeSellList || []).map((t: any) => ({ label: `${t.NAME} (#${t.id})`, value: String(t.id) }))}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Cost" className="!mb-0">
                <Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="VD: 1000" />
              </Form.Item>
              <Form.Item className="!mb-0">
                <Space align="center">
                  <Switch checked={isNew} onChange={setIsNew} />
                  <span>New</span>
                </Space>
              </Form.Item>
              <Form.Item className="!mb-0">
                <Space align="center">
                  <Switch checked={isSell} onChange={setIsSell} />
                  <span>Sell</span>
                </Space>
              </Form.Item>
              <Form.Item className="!mb-0 md:col-span-5">
                <Button htmlType="submit" type="primary">Thêm Item</Button>
              </Form.Item>
            </Form>

            {loadingItems ? (
              <div>Đang tải items...</div>
            ) : (
              <div className="relative w-full overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b">
                      <th className="h-10 px-2 text-left align-middle font-medium">ID</th>
                      <th className="h-10 px-2 text-left align-middle font-medium">Temp</th>
                      <th className="h-10 px-2 text-left align-middle font-medium">Tên</th>
                      <th className="h-10 px-2 text-left align-middle font-medium">Type</th>
                      <th className="h-10 px-2 text-left align-middle font-medium">Part</th>
                      <th className="h-10 px-2 text-left align-middle font-medium">Type Sell</th>
                      <th className="h-10 px-2 text-left align-middle font-medium">Cost</th>
                      <th className="h-10 px-2 text-left align-middle font-medium">Icon Spec</th>
                      <th className="h-10 px-2 text-left align-middle font-medium">Flags</th>
                      <th className="h-10 px-2 text-left align-middle font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(itemData?.items || []).map((it: any) => (
                      <tr key={it.id} className="hover:bg-muted/50 border-b transition-colors">
                        <td className="p-2 align-middle">{it.id}</td>
                        <td className="p-2 align-middle">#{it.temp_id}</td>
                        <td className="p-2 align-middle">{it.template?.NAME || '-'}</td>
                        <td className="p-2 align-middle">{it.template?.TYPE ?? '-'}</td>
                        <td className="p-2 align-middle">{it.template?.part ?? '-'}</td>
                        <td className="p-2 align-middle">{(typeSellList || []).find((t: any) => t.id === it.type_sell)?.NAME || (it.type_sell ?? '-')}</td>
                        <td className="p-2 align-middle">{it.cost ?? 0}</td>
                        <td className="p-2 align-middle">{it.template?.icon_id ?? it.icon_spec ?? '-'}</td>
                        <td className="p-2 align-middle">{[it.is_new ? 'NEW' : null, it.is_sell ? 'SELL' : null].filter(Boolean).join(', ')}</td>
                        <td className="p-2 align-middle">
                          <div className="flex gap-2">
                            <Button size="small" onClick={() => openEdit(it)}>Sửa</Button>
                            <Button size="small" onClick={() => onDeleteItem(it.id)}>Xóa</Button>
                            <Button size="small" onClick={() => openOptions(it.id)}>Options</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(loadingAllItems || isRefreshingItems) && (
              <div className="mt-2 text-xs text-muted-foreground">Đang tải danh sách item...</div>
            )}
          </Card>
        )}

        {/* Options dialog */}
        <Modal
          title={`Options cho Item #${optItemId ?? ''}`}
          open={optModalOpen}
          onCancel={() => setOptModalOpen(false)}
          footer={null}
          width={720}
        >
          <div className="space-y-4">
            <form className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end" onSubmit={addItemOption}>
              <div>
                <label className="block text-sm font-medium mb-1">Option</label>
                <Select
                  value={newOptionId || undefined}
                  onChange={(v) => setNewOptionId(String(v))}
                  placeholder="Chọn Option"
                  options={(optionTemplates || []).map((o: any) => ({ label: `${o.NAME} (#${o.id})`, value: String(o.id) }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Param</label>
                <Input value={newOptionParam} onChange={(e) => setNewOptionParam(e.target.value)} placeholder="VD: 10" />
              </div>
              <div>
                <Button htmlType="submit" type="primary">Thêm Option</Button>
              </div>
            </form>

            <div className="relative w-full overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b">
                    <th className="h-10 px-2 text-left align-middle font-medium">Option</th>
                    <th className="h-10 px-2 text-left align-middle font-medium">Param</th>
                    <th className="h-10 px-2 text-left align-middle font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {(itemOptions || []).map((opt: any) => (
                    <tr key={opt.option_id} className="hover:bg-muted/50 border-b transition-colors">
                      <td className="p-2 align-middle">{opt.option_name || `#${opt.option_id}`}</td>
                      <td className="p-2 align-middle">
                        <Input
                          defaultValue={String(opt.param)}
                          onBlur={(e) => {
                            const val = Number(e.target.value || 0);
                            if (!Number.isNaN(val)) updateItemOption(opt.option_id, val);
                          }}
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <Button size="small" onClick={() => deleteItemOption(opt.option_id)}>Xóa</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setOptModalOpen(false)}>Đóng</Button>
            </div>
          </div>
        </Modal>

        {/* Edit Item dialog */}
        <Modal
          title={`Chỉnh sửa Item #${editId ?? ''}`}
          open={editOpen}
          onCancel={() => setEditOpen(false)}
          onOk={saveEdit}
          okText="Lưu"
          cancelText="Hủy"
          width={800}
        >
          <Form
            form={editForm}
            layout="vertical"
            initialValues={{
              tempId: editTempId,
              typeSell: editTypeSell,
              cost: editCost,
              iconSpec: editIconSpec,
              isNew: editIsNew,
              isSell: editIsSell,
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item label="Item bán (item_template)" name="tempId">
                <ItemCombobox
                  placeholder="Tìm tên hoặc ID..."
                  items={allItems?.items || []}
                  value={editTempId}
                  onChange={setEditTempId}
                  disabled={loadingAllItems || isRefreshingItems}
                />
              </Form.Item>

              <Form.Item label="Type Sell" name="typeSell">
                <Select
                  value={editTypeSell || undefined}
                  onChange={(v) => setEditTypeSell(String(v))}
                  placeholder="Chọn Type Sell"
                  options={(typeSellList || []).map((t: any) => ({ label: `${t.NAME} (#${t.id})`, value: String(t.id) }))}
                />
              </Form.Item>

              <Form.Item label="Cost" name="cost">
                <Input
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  placeholder="VD: 1000"
                />
              </Form.Item>

              <Form.Item label="Icon Spec" name="iconSpec">
                <IconSelector
                  value={editIconSpec}
                  onChange={setEditIconSpec}
                  placeholder="Chọn item template..."
                  showPreview={true}
                  items={allItems?.items || []}
                />
              </Form.Item>

              <Form.Item name="isNew" valuePropName="checked">
                <Checkbox checked={editIsNew} onChange={(e) => setEditIsNew(e.target.checked)}>
                  New
                </Checkbox>
              </Form.Item>

              <Form.Item name="isSell" valuePropName="checked">
                <Checkbox checked={editIsSell} onChange={(e) => setEditIsSell(e.target.checked)}>
                  Sell
                </Checkbox>
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
