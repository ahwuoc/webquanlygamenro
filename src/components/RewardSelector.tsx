'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit } from 'lucide-react';

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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchItemTemplates = async () => {
            try {
                const response = await fetch('/api/items');
                if (response.ok) {
                    const data = await response.json();
                    setItemTemplates(data.items || []);
                }
            } catch (error) {
                console.error('Error fetching item templates:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItemTemplates();
    }, []);

    const addReward = () => {
        const newReward: RewardItem = {
            item_id: 1, // Default to first item template
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

    const getValidRewards = () => {
        return rewards.filter(reward => reward.item_id && reward.item_id > 0);
    };

    const getItemName = (itemId: number) => {
        const item = itemTemplates.find(template => template.id === itemId);
        return item ? item.NAME : `Item #${itemId}`;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Phần Thưởng Boss</CardTitle>
                    <CardDescription>Đang tải danh sách vật phẩm...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Phần Thưởng Boss
                    <Button onClick={addReward} size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Thêm Phần Thưởng
                    </Button>
                </CardTitle>
                <CardDescription>
                    Thiết lập các vật phẩm mà boss sẽ rơi khi bị tiêu diệt
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeReward(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Item Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`item-${index}`}>Vật phẩm</Label>
                                        <Select
                                            value={reward.item_id.toString()}
                                            onValueChange={(value) => updateReward(index, 'item_id', parseInt(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vật phẩm" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {itemTemplates.map((item) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.NAME} (ID: {item.id})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {reward.item_id > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                {getItemName(reward.item_id)}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Quantity */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`quantity-${index}`}>Số lượng</Label>
                                        <Input
                                            id={`quantity-${index}`}
                                            type="number"
                                            min="1"
                                            value={reward.quantity}
                                            onChange={(e) => updateReward(index, 'quantity', parseInt(e.target.value) || 1)}
                                        />
                                    </div>

                                    {/* Drop Rate */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`drop-rate-${index}`}>Tỷ lệ rơi (%)</Label>
                                        <Input
                                            id={`drop-rate-${index}`}
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={reward.drop_rate * 100}
                                            onChange={(e) => updateReward(index, 'drop_rate', parseFloat(e.target.value) / 100 || 0)}
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
            </CardContent>
        </Card>
    );
}
