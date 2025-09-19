'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag, message, Divider, Popconfirm, DatePicker, Collapse } from 'antd';
import dayjs from 'dayjs';
import OptionSelector from '@/components/OptionSelector';

type PlayerLimitType = 'NONE' | 'SPECIFIC_PLAYERS' | 'EXCLUDE_PLAYERS' | 'VIP_ONLY';

interface GiftCodeDTO {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    max_uses: number;
    current_uses: number;
    created_date: string;
    expired_date?: string | null;
    is_active: boolean;
    player_limit_type: PlayerLimitType;
    vip_level_min: number;
    gift_code_items?: Array<GiftCodeItemDTO>;
}

interface GiftCodeItemDTO {
    id: number;
    gift_code_id: number;
    item_id: number;
    quantity: number;
    gift_code_item_options?: Array<{ id: number; gift_code_item_id: number; option_id: number; param: number }>;
}

type RestrictionType = 'ALLOWED' | 'BLOCKED';
interface RestrictionDTO { id: number; gift_code_id: number; player_id: number; restriction_type: RestrictionType }

export default function GiftcodeEditPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params?.id);

    const [loading, setLoading] = useState(true);
    const [_savingMain, setSavingMain] = useState(false);
    const [data, setData] = useState<GiftCodeDTO | null>(null);
    const [form] = Form.useForm<Partial<GiftCodeDTO & { expired_date?: dayjs.Dayjs | null }>>();

    // Items
    const [items, setItems] = useState<GiftCodeItemDTO[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [newItem, setNewItem] = useState<{ item_id?: number; quantity?: number }>({});
    const [itemSearch, setItemSearch] = useState<string>('');
    const [itemOptions, setItemOptions] = useState<Array<{ value: number; label: string }>>([]);
    const [itemNameMap, setItemNameMap] = useState<Record<number, string>>({});

    // Restrictions
    const [restrictions, setRestrictions] = useState<RestrictionDTO[]>([]);
    const [loadingRestrictions, setLoadingRestrictions] = useState(false);
    const [addingRestriction, setAddingRestriction] = useState(false);
    const [newPlayerId, setNewPlayerId] = useState<number | undefined>(undefined);
    const [newRestrictionType, setNewRestrictionType] = useState<RestrictionType>('ALLOWED');
    const [playerSearch, setPlayerSearch] = useState<string>('');
    const [playerOptions, setPlayerOptions] = useState<Array<{ value: number; label: string }>>([]);
    const [optionNameMap, setOptionNameMap] = useState<Record<number, string>>({});
    const [savingAll, setSavingAll] = useState(false);
    const [newOptionByItem, setNewOptionByItem] = useState<Record<number, { optionId?: number; param?: number }>>({});

    const loadMain = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/giftcodes/${id}`);
            if (!res.ok) throw new Error('Không tải được gift code');
            const gc = await res.json();
            setData(gc);
            form.setFieldsValue({
                code: gc.code,
                name: gc.name,
                description: gc.description ?? '',
                max_uses: gc.max_uses ?? 0,
                is_active: Boolean(gc.is_active),
                player_limit_type: gc.player_limit_type ?? 'NONE',
                vip_level_min: gc.vip_level_min ?? 0,
                expired_date: gc.expired_date ? dayjs(gc.expired_date) : null,
            } as any);
        } catch (e: any) {
            message.error(e?.message || 'Lỗi tải gift code');
        } finally {
            setLoading(false);
        }

    }, [id, form]);

    async function addRestriction() {
        if (!newPlayerId || newPlayerId <= 0) {
            message.error('player_id không hợp lệ');
            return;
        }
        try {
            setAddingRestriction(true);
            const res = await fetch(`/api/giftcodes/${id}/restrictions`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: newPlayerId, restriction_type: newRestrictionType })
            });
            if (!res.ok) throw new Error('Thêm/chỉnh sửa restriction thất bại');
            const row = await res.json();
            setRestrictions((prev) => {
                const idx = prev.findIndex((r) => r.player_id === row.player_id);
                if (idx >= 0) { const copy = prev.slice(); copy[idx] = row; return copy; }
                return [row, ...prev];
            });
            setNewPlayerId(undefined);
            message.success('Đã lưu restriction');
        } catch (e: any) {
            message.error(e?.message || 'Lỗi khi lưu restriction');
        } finally {
            setAddingRestriction(false);
        }
    }

    async function deleteRestriction(player_id: number) {
        try {
            const res = await fetch(`/api/giftcodes/${id}/restrictions?player_id=${player_id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Xóa restriction thất bại');
            setRestrictions((prev) => prev.filter((r) => r.player_id !== player_id));
            message.success('Đã xóa restriction');
        } catch (e: any) {
            message.error(e?.message || 'Lỗi khi xóa restriction');
        }
    }

    const loadRestrictions = useCallback(async () => {
        try {
            setLoadingRestrictions(true);
            const res = await fetch(`/api/giftcodes/${id}/restrictions`);
            if (!res.ok) throw new Error('Không tải được restrictions');
            const list = await res.json();
            setRestrictions(Array.isArray(list) ? list : []);
        } catch (e: any) {
            message.error(e?.message || 'Lỗi tải restrictions');
        } finally {
            setLoadingRestrictions(false);
        }
    }, [id]);

    async function _searchOptions(_forItemId: number, _query: string) {
        // This function is no longer needed as OptionSelector handles search internally
        return;
    }

    // Load default options for all items
    useEffect(() => {
        // This useEffect is no longer needed as OptionSelector handles loading internally
        return;
    }, []);

    const loadItems = useCallback(async () => {
        try {
            setLoadingItems(true);
            const res = await fetch(`/api/giftcodes/${id}/items`);
            if (!res.ok) throw new Error('Không tải được items');
            const list = await res.json();
            const itemsList: GiftCodeItemDTO[] = Array.isArray(list) ? list : [];
            setItems(itemsList);
            const optIds = new Set<number>();
            const itemIds = new Set<number>();
            for (const it of itemsList) {
                if (typeof it.item_id === 'number') itemIds.add(it.item_id);
                for (const op of (it.gift_code_item_options || [])) {
                    if (typeof op.option_id === 'number') optIds.add(op.option_id);
                }
            }
            if (optIds.size > 0) {
                try {
                    const url = `/api/options/by-ids?ids=${Array.from(optIds).join(',')}`;
                    const oRes = await fetch(url);
                    if (oRes.ok) {
                        const json = await oRes.json();
                        const map: Record<number, string> = {};
                        for (const row of (json.options || [])) {
                            map[Number(row.id)] = String(row.NAME);
                        }
                        setOptionNameMap(map);
                    }
                } catch { }
            } else {
                setOptionNameMap({});
            }
            if (itemIds.size > 0) {
                try {
                    const url = `/api/items/by-ids?ids=${Array.from(itemIds).join(',')}`;
                    const iRes = await fetch(url);
                    if (iRes.ok) {
                        const json = await iRes.json();
                        const map: Record<number, string> = {};
                        for (const row of (json.items || [])) {
                            map[Number(row.id)] = String(row.NAME);
                        }
                        setItemNameMap(map);
                    }
                } catch { }
            } else {
                setItemNameMap({});
            }
            // Options are now handled by OptionSelector component
        } catch (e: any) {
            message.error(e?.message || 'Lỗi tải items');
        } finally {
            setLoadingItems(false);
        }
    }, [id]);

    useEffect(() => {
        if (!Number.isFinite(id) || id <= 0) return;
        loadMain();
        loadItems();
        loadRestrictions();
    }, [id, loadMain, loadItems, loadRestrictions]);


    // Watch for player_limit_type changes to show/hide restrictions

    // Remote search: players
    useEffect(() => {
        let active = true;
        const run = async () => {
            const q = playerSearch.trim();
            const url = q ? `/api/search/players?query=${encodeURIComponent(q)}&limit=20` : `/api/search/players?limit=20`;
            try {
                const res = await fetch(url);
                if (!res.ok) return;
                const json = await res.json();
                if (!active) return;
                const opts = (json.items || []).map((p: any) => ({ value: p.id, label: `${p.name || '#' + p.id} (#${p.id})` }));
                setPlayerOptions(opts);
            } catch { }
        };
        run();
        return () => { active = false; };
    }, [playerSearch]);

    // Remote search: items
    useEffect(() => {
        let active = true;
        const run = async () => {
            const q = itemSearch.trim();
            const url = q ? `/api/search/items?query=${encodeURIComponent(q)}&limit=20` : `/api/search/items?limit=20`;
            try {
                const res = await fetch(url);
                if (!res.ok) return;
                const json = await res.json();
                if (!active) return;
                const opts = (json.items || []).map((it: any) => ({ value: it.id, label: `${it.NAME || '#' + it.id} (#${it.id})` }));
                setItemOptions(opts);
            } catch { }
        };
        run();
        return () => { active = false; };
    }, [itemSearch]);

    // Save main gift code fields
    async function _saveMain() {
        try {
            const values = await form.validateFields();
            setSavingMain(true);
            const payload: any = {
                code: values.code,
                name: values.name,
                description: values.description ?? null,
                max_uses: typeof values.max_uses === 'number' ? values.max_uses : undefined,
                is_active: values.is_active,
                player_limit_type: values.player_limit_type,
                vip_level_min: values.vip_level_min,
                expired_date: values.expired_date ? values.expired_date.toISOString() : null,
            };
            const res = await fetch(`/api/giftcodes/${data?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Cập nhật thất bại');
            message.success('Đã lưu thông tin');
            loadMain();
        } catch (e: any) {
            if (e?.errorFields) message.error('Vui lòng kiểm tra lại các trường');
            else message.error(e?.message || 'Lỗi khi lưu');
        } finally {
            setSavingMain(false);
        }
    }

    async function addItem() {
        if (!newItem.item_id || newItem.item_id < 0) {
            message.error('item_id không hợp lệ');
            return;
        }
        try {
            const res = await fetch(`/api/giftcodes/${id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: newItem.item_id, quantity: newItem.quantity ?? 1 }),
            });
            if (!res.ok) throw new Error('Thêm item thất bại');
            message.success('Đã thêm item');
            setNewItem({});
            loadItems();
        } catch (e: any) {
            message.error(e?.message || 'Lỗi khi thêm item');
        }
    }

    async function deleteItem(row: GiftCodeItemDTO) {
        try {
            const res = await fetch(`/api/giftcodes/${id}/items/${row.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Xóa item thất bại');
            message.success('Đã xóa item');
            loadItems();
        } catch (e: any) {
            message.error(e?.message || 'Lỗi khi xóa item');
        }
    }

    async function updateItemQuantity(row: GiftCodeItemDTO, quantity: number) {
        try {
            const res = await fetch(`/api/giftcodes/${id}/items/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity }) });
            if (!res.ok) throw new Error('Cập nhật số lượng thất bại');
            message.success('Đã cập nhật số lượng');
            loadItems();
        } catch (e: any) {
            message.error(e?.message || 'Lỗi khi cập nhật');
        }
    }

    async function addOption(gift_code_item_id: number, option_id?: number, param?: number) {
        if (option_id === undefined) {
            message.error('option_id không hợp lệ');
            return;
        }
        try {
            const res = await fetch(`/api/giftcodes/${id}/items/${gift_code_item_id}/options`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ option_id, param: param ?? 0 })
            });
            if (!res.ok) throw new Error('Thêm option thất bại');
            message.success('Đã thêm option');
            setNewOptionByItem(prev => ({ ...prev, [gift_code_item_id]: { optionId: undefined, param: undefined } }));
            loadItems();
        } catch (e: any) {
            message.error(e?.message || 'Lỗi khi thêm option');
        }
    }

    async function deleteOption(gift_code_item_id: number, option_id: number) {
        try {
            const res = await fetch(`/api/giftcodes/${id}/items/${gift_code_item_id}/options/${option_id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Xóa option thất bại');
            message.success('Đã xóa option');
            loadItems();
        } catch (e: any) {
            message.error(e?.message || 'Lỗi khi xóa option');
        }
    }

    // Save all changes at once
    async function saveAll() {
        try {
            setSavingAll(true);

            // 1. Save main gift code info
            const formValues = await form.validateFields();
            const mainPayload = {
                code: formValues.code,
                name: formValues.name,
                description: formValues.description ?? null,
                max_uses: typeof formValues.max_uses === 'number' ? formValues.max_uses : undefined,
                is_active: formValues.is_active,
                player_limit_type: formValues.player_limit_type,
                vip_level_min: formValues.vip_level_min,
                expired_date: formValues.expired_date ? formValues.expired_date.toISOString() : null,
            };

            const mainRes = await fetch(`/api/giftcodes/${data?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mainPayload)
            });
            if (!mainRes.ok) throw new Error('Cập nhật thông tin chính thất bại');

            message.success('Đã lưu toàn bộ thông tin giftcode');

            // Reload all data
            await Promise.all([
                loadMain(),
                loadItems(),
                loadRestrictions()
            ]);

        } catch (e: any) {
            if (e?.errorFields) {
                message.error('Vui lòng kiểm tra lại các trường bắt buộc');
            } else {
                message.error(e?.message || 'Lỗi khi lưu toàn bộ');
            }
        } finally {
            setSavingAll(false);
        }
    }

    // Columns are no longer needed as we're using Card layout instead of Table

    if (!Number.isFinite(id) || id <= 0) {
        return <div className="p-6">ID không hợp lệ</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Sửa Gift Code</h1>
                        {data && <div className="text-gray-600">Code: <b>{data.code}</b> • ID: {data.id}</div>}
                    </div>
                    <Button onClick={() => router.push('/giftcodes')}>Quay lại</Button>
                </div>

                <Card title="Thông tin chính" loading={loading}>
                    <Form layout="vertical" form={form}>
                        <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Nhập code' }]}>
                            <Input placeholder="Mã gift code" />
                        </Form.Item>
                        <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}>
                            <Input placeholder="Tên hiển thị" />
                        </Form.Item>
                        <Form.Item name="description" label="Mô tả">
                            <Input.TextArea rows={3} placeholder="Mô tả" />
                        </Form.Item>
                        <Space className="w-full" wrap>
                            <Form.Item name="max_uses" label="Giới hạn lượt" className="min-w-[180px]">
                                <InputNumber min={0} placeholder="0 = unlimited" />
                            </Form.Item>
                            <Form.Item name="is_active" label="Trạng thái" className="min-w-[180px]">
                                <Select options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
                            </Form.Item>
                            <Form.Item name="player_limit_type" label="Giới hạn player" className="min-w-[280px]">
                                <Select
                                    options={[
                                        {
                                            label: 'Không giới hạn',
                                            value: 'NONE'
                                        },
                                        {
                                            label: 'Chỉ cho phép player cụ thể',
                                            value: 'SPECIFIC_PLAYERS'
                                        },
                                        {
                                            label: 'Chặn player cụ thể',
                                            value: 'EXCLUDE_PLAYERS'
                                        },
                                        {
                                            label: 'Chỉ VIP',
                                            value: 'VIP_ONLY'
                                        },
                                    ]}
                                    optionRender={(option) => (
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {option.value === 'NONE' && 'Tất cả player đều có thể sử dụng'}
                                                {option.value === 'SPECIFIC_PLAYERS' && 'Chỉ những player được phép mới dùng được'}
                                                {option.value === 'EXCLUDE_PLAYERS' && 'Chặn những player không được phép'}
                                                {option.value === 'VIP_ONLY' && 'Chỉ player có VIP level đủ mới dùng được'}
                                            </div>
                                        </div>
                                    )}
                                />
                            </Form.Item>
                            <Form.Item name="vip_level_min" label="VIP min" className="min-w-[160px]">
                                <InputNumber min={0} />
                            </Form.Item>
                            <Form.Item name="expired_date" label="Ngày hết hạn" className="min-w-[260px]">
                                <DatePicker
                                    showTime
                                    format="YYYY-MM-DD HH:mm:ss"
                                    placeholder="Chọn ngày hết hạn"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Space>
                    </Form>
                </Card>

                <Card title="Restrictions (ALLOWED/BLOCKED players)" loading={loadingRestrictions}>
                    <Space align="end" className="mb-3" wrap>
                        <Select
                            showSearch
                            placeholder="Tìm player..."
                            filterOption={false}
                            onSearch={setPlayerSearch}
                            onChange={(v) => setNewPlayerId(Number(v))}
                            options={playerOptions}
                            style={{ minWidth: 280 }}
                        />
                        <Select value={newRestrictionType} onChange={(v) => setNewRestrictionType(v)} options={[{ label: 'ALLOWED', value: 'ALLOWED' }, { label: 'BLOCKED', value: 'BLOCKED' }]} />
                        <Button type="primary" loading={addingRestriction} onClick={addRestriction} disabled={!newPlayerId}>Thêm / Cập nhật</Button>
                    </Space>

                    <Table
                        rowKey={(r) => `${r.player_id}`}
                        dataSource={restrictions}
                        pagination={false}
                        columns={[
                            { title: 'Player ID', dataIndex: 'player_id', key: 'player_id', width: 140 },
                            { title: 'Type', dataIndex: 'restriction_type', key: 'restriction_type', width: 140 },
                            {
                                title: 'Actions', key: 'actions', render: (_: any, r: RestrictionDTO) => (
                                    <Popconfirm title="Xóa restriction này?" okText="Xóa" cancelText="Hủy" onConfirm={() => deleteRestriction(r.player_id)}>
                                        <Button danger size="small">Xóa</Button>
                                    </Popconfirm>
                                )
                            },
                        ]}
                    />
                </Card>

                <Card title="Items" loading={loadingItems}>
                    {/* Add Item Form */}
                    <Card size="small" className="mb-4" title="Thêm Item Mới">
                        <Form layout="inline" onFinish={addItem}>
                            <Form.Item label="Item" required>
                                <Select
                                    showSearch
                                    placeholder="Tìm item..."
                                    filterOption={false}
                                    onSearch={setItemSearch}
                                    onChange={(v) => setNewItem((p) => ({ ...p, item_id: Number(v) }))}
                                    options={itemOptions}
                                    style={{ minWidth: 300 }}
                                />
                            </Form.Item>
                            <Form.Item label="Số lượng" required>
                                <InputNumber
                                    placeholder="quantity"
                                    min={1}
                                    value={newItem.quantity as any}
                                    onChange={(v) => setNewItem((p) => ({ ...p, quantity: Number(v) }))}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" disabled={!(newItem.item_id !== undefined)}>
                                    + Thêm Item
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    {/* Items List with Collapse */}
                    {items.length > 0 ? (
                        <Collapse
                            size="small"
                            items={items.map((item) => ({
                                key: item.id.toString(),
                                label: (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center space-x-4">
                                            <span className="font-medium">
                                                {itemNameMap[item.item_id] || `#${item.item_id}`}
                                            </span>
                                            <Tag color="green">x{item.quantity}</Tag>
                                            <Tag color="blue">{item.gift_code_item_options?.length || 0} options</Tag>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <InputNumber
                                                size="small"
                                                min={1}
                                                defaultValue={item.quantity}
                                                onBlur={(e) => {
                                                    const v = Number((e.target as HTMLInputElement).value);
                                                    if (!Number.isNaN(v)) updateItemQuantity(item, v);
                                                }}
                                            />
                                            <Button danger size="small" onClick={(e) => {
                                                e.stopPropagation();
                                                deleteItem(item);
                                            }}>
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                ),
                                children: (
                                    <div className="p-4 bg-gray-50 rounded">
                                        {/* Existing Options */}
                                        <div>
                                            <div className="font-medium text-sm mb-2">Options:</div>
                                            <div className="flex flex-wrap gap-2">
                                                {(item.gift_code_item_options || []).map(opt => {
                                                    const name = optionNameMap[opt.option_id];
                                                    return (
                                                        <Tag
                                                            key={opt.id}
                                                            closable
                                                            onClose={() => deleteOption(item.id, opt.id)}
                                                            color="blue"
                                                            className="text-xs"
                                                        >
                                                            {name ? `${name} (#${opt.option_id})` : `#${opt.option_id}`}: {opt.param}
                                                        </Tag>
                                                    );
                                                })}
                                            </div>

                                            {/* Show add option layout when no options exist */}
                                            {(!item.gift_code_item_options || item.gift_code_item_options.length === 0) && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                                    <div className="text-sm text-blue-700 mb-2">Chưa có option nào. Hãy thêm option đầu tiên:</div>
                                                    <div className="flex items-center space-x-2">
                                                        <OptionSelector
                                                            placeholder="Tìm option (tên hoặc ID)..."
                                                            onChange={(v) => setNewOptionByItem(prev => ({ ...prev, [item.id]: { ...prev[item.id], optionId: Number(v) } }))}
                                                        />
                                                        <InputNumber
                                                            placeholder="param"
                                                            onChange={(v) => setNewOptionByItem(prev => ({ ...prev, [item.id]: { ...prev[item.id], param: Number(v) } }))}
                                                        />
                                                        <Button
                                                            size="small"
                                                            type="primary"
                                                            onClick={() => addOption(item.id, newOptionByItem[item.id]?.optionId, newOptionByItem[item.id]?.param)}
                                                            disabled={!newOptionByItem[item.id]?.optionId}
                                                        >
                                                            + Thêm Option
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Show add option layout when options exist */}
                                            {(item.gift_code_item_options && item.gift_code_item_options.length > 0) && (
                                                <div className="mt-3 p-3 bg-white rounded border">
                                                    <div className="text-sm text-gray-600 mb-2">Thêm option mới:</div>
                                                    <div className="flex items-center space-x-2">
                                                        <OptionSelector
                                                            placeholder="Tìm option (tên hoặc ID)..."
                                                            onChange={(v) => setNewOptionByItem(prev => ({ ...prev, [item.id]: { ...prev[item.id], optionId: Number(v) } }))}
                                                        />
                                                        <InputNumber
                                                            placeholder="param"
                                                            onChange={(v) => setNewOptionByItem(prev => ({ ...prev, [item.id]: { ...prev[item.id], param: Number(v) } }))}
                                                        />
                                                        <Button
                                                            size="small"
                                                            type="primary"
                                                            onClick={() => addOption(item.id, newOptionByItem[item.id]?.optionId, newOptionByItem[item.id]?.param)}
                                                            disabled={!newOptionByItem[item.id]?.optionId}
                                                        >
                                                            + Thêm Option
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            }))}
                        />
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            Chưa có item nào. Hãy thêm item đầu tiên!
                        </div>
                    )}
                </Card>

                <Divider />

                {/* Save All Button */}
                <Card className="mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Lưu thay đổi</h3>
                            <p className="text-sm text-gray-600">Lưu tất cả thay đổi của giftcode này</p>
                        </div>
                        <Button
                            type="primary"
                            size="large"
                            loading={savingAll}
                            onClick={saveAll}
                            className="min-w-[120px]"
                        >
                            {savingAll ? 'Đang lưu...' : 'Lưu toàn bộ'}
                        </Button>
                    </div>
                </Card>

                <div className="text-xs text-gray-500 mt-4">
                    💡 Mẹo: Bạn có thể thêm option nhanh bằng cách nhập option_id và param tương ứng ở hàng item.
                </div>
            </div>
        </div>
    );
}
