'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Select, Tag, Input } from 'antd';

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
    const [typeMap, setTypeMap] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Auto-load all items on mount
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/items?limit=all');
                if (response.ok) {
                    const data = await response.json();
                    if (!cancelled) {
                        setItemTemplates(data.items || []);
                        const map: Record<number, string> = {};
                        (data.types || []).forEach((t: { id: number; NAME: string }) => { map[t.id] = t.NAME; });
                        setTypeMap(map);
                    }
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const addReward = () => {
        const firstId = itemTemplates[0]?.id ?? 1;
        const newReward: RewardItem = {
            item_id: firstId,
            quantity: 1,
            drop_rate: 10, // 10% default
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

    if (isLoading && itemTemplates.length === 0) {
        return (
            <Card title="Phần Thưởng Boss">
                <div className="text-sm text-gray-600">Đang nạp danh sách vật phẩm vào bộ nhớ đệm...</div>
            </Card>
        );
    }

    return (
        <Card title="Phần Thưởng Boss" extra={
            <div className="flex items-center gap-2">
                <Button onClick={addReward} size="small" disabled={isLoading || itemTemplates.length === 0}>Thêm Phần Thưởng</Button>
            </div>
        }>
            {rewards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>Chưa có phần thưởng nào</p>
                    <p className="text-sm">Nhấn "Thêm Phần Thưởng" để bắt đầu</p>
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
                                        showSearch
                                        filterOption={(input, option) => {
                                            const label = (option?.label as string) || '';
                                            return label.toLowerCase().includes(input.toLowerCase());
                                        }}
                                        options={itemTemplates.map((item) => ({
                                            label: `${item.NAME} (ID: ${item.id}) • Type ${item.TYPE}${typeMap[item.TYPE] ? ` - ${typeMap[item.TYPE]}` : ''}`,
                                            value: item.id.toString(),
                                        }))}
                                        placeholder="Chọn vật phẩm"
                                        style={{ width: '100%' }}
                                        loading={isLoading}
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
                                        min={1}
                                        value={reward.quantity}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateReward(index, 'quantity', parseInt(e.target.value) || 1)}
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Drop Rate */}
                                <div className="space-y-2">
                                    <label htmlFor={`drop-rate-${index}`}>Tỷ lệ rơi (%)</label>
                                    <Input
                                        id={`drop-rate-${index}`}
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={reward.drop_rate}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateReward(index, 'drop_rate', parseFloat(e.target.value) || 0)}
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-gray-500">
                                        {reward.drop_rate > 0 ? `${reward.drop_rate.toFixed(1)}%` : '0%'}
                                    </p>
                                </div>
                            </div>

                            {/* Reward Summary */}
                            <div className="bg-gray-50 rounded p-3">
                                <p className="text-sm">
                                    <strong>Tóm tắt:</strong> {reward.quantity}x {getItemName(reward.item_id)}
                                    với tỷ lệ rơi {reward.drop_rate.toFixed(1)}%
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
                                    ? `${(rewards.reduce((sum, reward) => sum + reward.drop_rate, 0) / rewards.length).toFixed(1)}%`
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
