'use client';

import { useState, useEffect } from 'react';
import { Card, Select, Input, Button, Tag } from "antd";

interface ItemTemplate { id: number; NAME: string; TYPE?: number; }

interface OutfitSelectorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export default function OutfitSelector({ value, onChange, error }: OutfitSelectorProps) {
    const [items, setItems] = useState<ItemTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [isWarm, setIsWarm] = useState(false);
    const [cachedAt, setCachedAt] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null);

    const warmUpCache = async () => {
        setLoading(true);
        try {
            // Warm cache and load all items
            const response = await fetch('/api/items?refresh=1&limit=all');
            if (response.ok) {
                const data = await response.json();
                // Filter TYPE = 5 (outfits) on client
                const boiled = (data.items || [])
                    .filter((it: any) => it.TYPE === 5)
                    .map((it: any) => ({ id: it.id, NAME: it.NAME, TYPE: it.TYPE }));
                setItems(boiled);
                setIsWarm(true);
                if (data.pagination?.cachedAt) setCachedAt(data.pagination.cachedAt);
            }
        } catch (error) {
            console.error('Error warming outfits cache:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Parse initial value - expect a single outfit ID
        try {
            const parsedValue = JSON.parse(value || 'null');
            if (parsedValue && typeof parsedValue === 'number') {
                setSelectedOutfitId(parsedValue);
            }
        } catch (error) {
            console.error('Error parsing initial value:', error);
        }
    }, [value]);

    const handleOutfitSelect = (outfitId: string) => {
        const id = parseInt(outfitId);
        setSelectedOutfitId(id);
        onChange(JSON.stringify(id));
    };

    const clearSelection = () => {
        setSelectedOutfitId(null);
        onChange(JSON.stringify(null));
    };

    const filteredItems = items.filter(item =>
        item.NAME.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && !isWarm) {
        return (
            <Card
                title="Chọn Trang Phục"
                extra="Đang nạp trang phục (TYPE=5) vào cache..."
            >
                <div className="text-center py-4">Đang tải...</div>
            </Card>
        );
    }

    return (
        <Card
            title={
                <div className="flex items-center justify-between">
                    Chọn Trang Phục
                    {!isWarm && (
                        <Button type="default" size="small" onClick={warmUpCache} disabled={loading}>
                            {loading ? 'Đang tải...' : 'Tải danh sách item vào cache'}
                        </Button>
                    )}
                </div>
            }
            extra={
                <div>
                    Chọn trang phục cho boss (chỉ được chọn 1)
                    {selectedOutfitId && (
                        <Tag color="blue" className="ml-2">
                            Đã chọn trang phục
                        </Tag>
                    )}
                </div>
            }
        >
            <div className="space-y-4">
                {isWarm && (
                    <div className="text-xs text-gray-600">
                        Đã nạp: <strong>{items.length}</strong> trang phục • {cachedAt ? `Cập nhật: ${new Date(cachedAt).toLocaleString()}` : ''}
                    </div>
                )}
                {/* Outfit Selection (Items TYPE=5) */}
                <div className="space-y-2">
                    <label htmlFor="outfit-select">Trang phục</label>
                    <Select
                        value={selectedOutfitId?.toString() || undefined}
                        onChange={handleOutfitSelect}
                        disabled={!isWarm}
                        placeholder="Chọn trang phục cho boss"
                        showSearch
                        filterOption={(input, option) => {
                            const label = option?.label as string || "";
                            return label.toLowerCase().includes(input.toLowerCase());
                        }}
                        options={filteredItems.map((item) => ({
                            label: item.NAME,
                            value: item.id.toString(),
                            key: item.id
                        }))}
                        style={{ width: '100%' }}
                    />
                    {selectedOutfitId && (
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="text-sm text-red-600 hover:text-red-700"
                        >
                            Xóa lựa chọn
                        </button>
                    )}
                </div>

                {/* Selected Outfit Details (ID + NAME only) */}
                {selectedOutfitId && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Trang phục đã chọn:</h4>
                        {(() => {
                            const selectedItem = items.find(o => o.id === selectedOutfitId);
                            if (selectedItem) {
                                return (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-blue-900">{selectedItem.NAME}</span>
                                            <Tag color="default">ID: {selectedItem.id}</Tag>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                )}

                {/* Search by NAME only */}
                <div className="space-y-2">
                    <label htmlFor="outfit-search">Tìm kiếm theo tên</label>
                    <Input
                        id="outfit-search"
                        placeholder="Nhập tên trang phục..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={!isWarm}
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}
            </div>
        </Card>
    );
}
