'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ItemTemplate {
    id: number;
    NAME: string;
}

interface OutfitSelectorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export default function OutfitSelector({ value, onChange, error }: OutfitSelectorProps) {
    const [items, setItems] = useState<ItemTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null);

    useEffect(() => {
        const fetchOutfits = async () => {
            try {
                // Fetch items of TYPE = 5 (outfits)
                const response = await fetch('/api/items?type=5&limit=1000');
                if (response.ok) {
                    const data = await response.json();
                    const boiled = (data.items || []).map((it: any) => ({ id: it.id, NAME: it.NAME }));
                    setItems(boiled);
                }
            } catch (error) {
                console.error('Error fetching outfits:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOutfits();
    }, []);

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

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Chọn Trang Phục</CardTitle>
                    <CardDescription>Đang tải danh sách trang phục...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">Loading...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chọn Trang Phục</CardTitle>
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
                    {/* Outfit Selection (Items TYPE=5) */}
                    <div className="space-y-2">
                        <Label htmlFor="outfit-select">Trang phục</Label>
                        <Select
                            value={selectedOutfitId?.toString() || ''}
                            onValueChange={handleOutfitSelect}
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
