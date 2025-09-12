'use client';

import { useState, useMemo } from 'react';
import { Card, Button, Input, Select, Tag } from 'antd';

interface RewardItem {
    id?: number;
    item_id: number;
    quantity: number;
    drop_rate: number;
}

interface RewardSelectorProps {
    rewards: RewardItem[];
    onRewardsChange: (rewards: RewardItem[]) => void;
}

export default function RewardSelector({ rewards, onRewardsChange }: RewardSelectorProps) {
    const [itemTemplates, setItemTemplates] = useState<any[]>([]);
    const [types, setTypes] = useState<{ id: number; NAME: string }[]>([]);
    const [typeMap, setTypeMap] = useState<Record<number, string>>({});
    const [itemFilter, setItemFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("all"); // 'all' or TYPE number as string
    const [isLoading, setIsLoading] = useState(false);
    const [isWarm, setIsWarm] = useState(false);
    const [cachedAt, setCachedAt] = useState<number | null>(null);

    // Only fetch items after user warms cache to avoid lag
    const warmUpCache = async () => {
        setIsLoading(true);
        try {
            // Warm cache and retrieve all at once
            const response = await fetch('/api/items?refresh=1&limit=all');
            if (response.ok) {
                const data = await response.json();
                setItemTemplates(data.items || []);
                setTypes(data.types || []);
                const map: Record<number, string> = {};
                (data.types || []).forEach((t: { id: number; NAME: string }) => { map[t.id] = t.NAME; });
                setTypeMap(map);
                setIsWarm(true);
                if (data.pagination?.cachedAt) setCachedAt(data.pagination.cachedAt);
            }
        } catch (error) {
            console.error('Error warming items cache:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Build unique TYPE list and filtered items
    const uniqueTypes = useMemo(() => {
        if (types.length > 0) return types.map(t => t.id);
        const s = new Set<number>();
        for (const it of itemTemplates) {
            if (typeof it.TYPE === 'number') s.add(it.TYPE);
        }
        return Array.from(s).sort((a, b) => a - b);
    }, [types, itemTemplates]);

    const filteredItems = useMemo(() => {
        const f = (itemFilter || '').trim().toLowerCase();
        const typeSel = typeFilter !== 'all' ? parseInt(typeFilter) : undefined;
        return itemTemplates.filter((it) => {
            if (typeSel !== undefined && it.TYPE !== typeSel) return false;
            if (!f) return true;
            const byName = it.NAME?.toLowerCase().includes(f);
            const byId = String(it.id).includes(f);
            return byName || byId;
        });
    }, [itemTemplates, itemFilter, typeFilter]);

    const addReward = () => {
        const newReward: RewardItem = {
            item_id: (filteredItems[0]?.id ?? itemTemplates[0]?.id ?? 1), // default to first filtered or first item
            quantity: 1,
            drop_rate: 0.1
        };
        onRewardsChange([...rewards, newReward]);
    };

    const removeReward = (index: number) => {
        const newRewards = rewards.filter((_, i) => i !== index);
        onRewardsChange(newRewards);
    };

    const updateReward = (index: number, field: keyof RewardItem, value: any) => {
        const newRewards = [...rewards];
        newRewards[index] = { ...newRewards[index], [field]: value };
        onRewardsChange(newRewards);
    };

    const _getValidRewards = () => {
        return rewards.filter(reward => reward.item_id && reward.item_id > 0);
    };

    const getItemName = (itemId: number) => {
        const item = itemTemplates.find(template => template.id === itemId);
        return item ? item.NAME : `Item #${itemId}`;
    };

    if (isLoading && !isWarm) {
        return (
            <Card title="Phần Thưởng Boss">
                <div className="text-sm text-gray-600">Đang nạp danh sách vật phẩm vào bộ nhớ đệm...</div>
            </Card>
        );
    }

    return (
        <Card title="Phần Thưởng Boss" extra={
            <div className="flex items-center gap-2">
                {!isWarm && (
                    <Button onClick={warmUpCache} size="small" disabled={isLoading}>
                        {isLoading ? 'Đang tải...' : 'Tải danh sách item vào cache'}
                    </Button>
                )}
                <Button onClick={addReward} size="small" disabled={!isWarm}>Thêm Phần Thưởng</Button>
            </div>
        }>
            {isWarm && (
                <div className="mb-3 text-xs text-gray-600 flex flex-wrap gap-3">
                    <span>Đã nạp: <strong>{itemTemplates.length}</strong> items</span>
                    <span>Loại (TYPE): <strong>{types.length}</strong></span>
                    {cachedAt && (
                        <span>Cập nhật: {new Date(cachedAt).toLocaleString()}</span>
                    )}
                </div>
            )}
            {/* Global filter for items list */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="text-xs text-gray-600">Lọc theo tên hoặc ID vật phẩm</label>
                    <Input
                        value={itemFilter}
                        onChange={(e) => setItemFilter(e.target.value)}
                        placeholder="Ví dụ: 12 hoặc 'găng'"
                        disabled={!isWarm}
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-600">Lọc theo loại (TYPE)</label>
                    <Select
                        value={typeFilter}
                        onChange={(v) => setTypeFilter(String(v))}
                        disabled={!isWarm}
                        options={[{ label: 'Tất cả', value: 'all' }, ...uniqueTypes.map((t) => ({ label: `Type ${t}${typeMap[t] ? ` - ${typeMap[t]}` : ''}`, value: String(t) }))]}
                        style={{ width: '100%' }}
                        placeholder="Tất cả"
                    />
                </div>
            </div>
            {rewards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>Chưa có phần thưởng nào</p>
                    {!isWarm ? (
                        <p className="text-sm">Vui lòng bấm "Tải danh sách item vào cache" trước khi thêm phần thưởng</p>
                    ) : (
                        <p className="text-sm">Nhấn "Thêm Phần Thưởng" để bắt đầu</p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {rewards.map((reward, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Phần thưởng #{index + 1}</h4>
                                <Button size="small" danger onClick={() => removeReward(index)}>
                                    Xóa
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Item Selection */}
                                <div className="space-y-2">
                                    <label htmlFor={`item-${index}`}>Vật phẩm</label>
                                    <Select
                                        value={reward.item_id.toString()}
                                        onChange={(value) => updateReward(index, 'item_id', parseInt(String(value)))}
                                        disabled={!isWarm}
                                        showSearch
                                        options={filteredItems.map((item) => ({
                                            label: `${item.NAME} (ID: ${item.id}) • Type ${item.TYPE}${typeMap[item.TYPE] ? ` - ${typeMap[item.TYPE]}` : ''}`,
                                            value: item.id.toString(),
                                        }))}
                                        placeholder="Chọn vật phẩm"
                                        style={{ width: '100%' }}
                                    />
                                    {reward.item_id > 0 && (
                                        <Tag>{getItemName(reward.item_id)}</Tag>
                                    )}
                                </div>

                                {/* Quantity */}
                                <div className="space-y-2">
                                    <label htmlFor={`quantity-${index}`}>Số lượng</label>
                                    <Input
                                        id={`quantity-${index}`}
                                        type="number"
                                        min="1"
                                        value={reward.quantity}
                                        onChange={(e) => updateReward(index, 'quantity', parseInt(e.target.value) || 1)}
                                        disabled={!isWarm}
                                    />
                                </div>

                                {/* Drop Rate */}
                                <div className="space-y-2">
                                    <label htmlFor={`drop-rate-${index}`}>Tỷ lệ rơi (%)</label>
                                    <Input
                                        id={`drop-rate-${index}`}
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={reward.drop_rate * 100}
                                        onChange={(e) => updateReward(index, 'drop_rate', parseFloat(e.target.value) / 100 || 0)}
                                        disabled={!isWarm}
                                    />
                                    <p className="text-xs text-gray-500">
                                        {reward.drop_rate > 0 ? `${(reward.drop_rate * 100).toFixed(1)}%` : '0%'}
                                    </p>
                                </div>
                            </div>

                            {/* Reward Summary */}
                            <div className="bg-gray-50 rounded p-3">
                                <p className="text-sm">
                                    <strong>Tóm tắt:</strong> {reward.quantity}x {getItemName(reward.item_id)}
                                    với tỷ lệ rơi {(reward.drop_rate * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Total Rewards Summary */}
            {rewards.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Tổng kết phần thưởng</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-blue-700">Tổng số phần thưởng:</span>
                            <span className="ml-2 font-medium">{rewards.length}</span>
                        </div>
                        <div>
                            <span className="text-blue-700">Tổng số lượng vật phẩm:</span>
                            <span className="ml-2 font-medium">
                                {rewards.reduce((sum, reward) => sum + reward.quantity, 0)}
                            </span>
                        </div>
                        <div>
                            <span className="text-blue-700">Tỷ lệ rơi trung bình:</span>
                            <span className="ml-2 font-medium">
                                {rewards.length > 0
                                    ? `${(rewards.reduce((sum, reward) => sum + reward.drop_rate, 0) / rewards.length * 100).toFixed(1)}%`
                                    : '0%'
                                }
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
