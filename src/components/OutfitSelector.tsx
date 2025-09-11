'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
            <Card>
                <CardHeader>
                    <CardTitle>Chọn Trang Phục</CardTitle>
                    <CardDescription>Đang nạp trang phục (TYPE=5) vào cache...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">Đang tải...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Chọn Trang Phục
                    {!isWarm && (
                        <Button type="button" size="sm" variant="secondary" onClick={warmUpCache} disabled={loading}>
                            {loading ? 'Đang tải...' : 'Tải danh sách item vào cache'}
                        </Button>
                    )}
                </CardTitle>
                <CardDescription>
                    Chọn trang phục cho boss (chỉ được chọn 1)
                    {selectedOutfitId && (
                        <Badge variant="secondary" className="ml-2">
                            Đã chọn trang phục
                        </Badge>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {isWarm && (
                        <div className="text-xs text-gray-600">
                            Đã nạp: <strong>{items.length}</strong> trang phục • {cachedAt ? `Cập nhật: ${new Date(cachedAt).toLocaleString()}` : ''}
                        </div>
                    )}
                    {/* Outfit Selection (Items TYPE=5) */}
                    <div className="space-y-2">
                        <Label htmlFor="outfit-select">Trang phục</Label>
                        <Select
                            value={selectedOutfitId?.toString() || ''}
                            onValueChange={handleOutfitSelect}
                            disabled={!isWarm}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn trang phục cho boss" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.NAME}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                                <Badge variant="outline">ID: {selectedItem.id}</Badge>
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
                        <Label htmlFor="outfit-search">Tìm kiếm theo tên</Label>
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
            </CardContent>
        </Card>
    );
}
