'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Map {
    id: number;
    NAME: string;
    zones: number;
    max_player: number;
    type: number;
    planet_id: number;
}

interface MapSelectorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export default function MapSelector({ value, onChange, error }: MapSelectorProps) {
    const [maps, setMaps] = useState<Map[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaps, setSelectedMaps] = useState<number[]>([]);

    useEffect(() => {
        const fetchMaps = async () => {
            try {
                const response = await fetch('/api/maps');
                if (response.ok) {
                    const mapsData = await response.json();
                    setMaps(mapsData);
                }
            } catch (error) {
                console.error('Error fetching maps:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMaps();
    }, []);

    useEffect(() => {
        // Parse initial value
        try {
            const parsedValue = JSON.parse(value || '{}');
            console.log('MapSelector parsing value:', value, 'parsed:', parsedValue);

            // Handle different formats
            if (parsedValue.map_ids && Array.isArray(parsedValue.map_ids)) {
                // Format: {map_ids: [1, 2, 3], selected_count: 3}
                console.log('Using map_ids format:', parsedValue.map_ids);
                setSelectedMaps(parsedValue.map_ids);
            } else if (Array.isArray(parsedValue)) {
                // Format: [1, 2, 3]
                console.log('Using array format:', parsedValue);
                setSelectedMaps(parsedValue);
            } else if (typeof parsedValue === 'object' && parsedValue !== null) {
                // Try to find any array in the object
                const arrayValues = Object.values(parsedValue).filter(val => Array.isArray(val));
                if (arrayValues.length > 0) {
                    console.log('Using object array format:', arrayValues[0]);
                    setSelectedMaps(arrayValues[0] as number[]);
                } else {
                    console.log('No array found in object, setting empty');
                    setSelectedMaps([]);
                }
            } else {
                console.log('Unknown format, setting empty');
                setSelectedMaps([]);
            }
        } catch (error) {
            console.error('Error parsing initial value:', error);
            setSelectedMaps([]);
        }
    }, [value]);

    const handleMapToggle = (mapId: number) => {
        const newSelectedMaps = selectedMaps.includes(mapId)
            ? selectedMaps.filter(id => id !== mapId)
            : [...selectedMaps, mapId];

        console.log('MapSelector toggle:', mapId, 'new selected:', newSelectedMaps);
        setSelectedMaps(newSelectedMaps);
        const newValue = JSON.stringify(newSelectedMaps);
        onChange(newValue);
    };

    const filteredMaps = maps.filter(map =>
        map.NAME.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log('MapSelector state:', { selectedMaps, filteredMaps: filteredMaps.length, totalMaps: maps.length });

    const getPlanetName = (planetId: number) => {
        switch (planetId) {
            case 0: return 'Trái Đất';
            case 1: return 'Namek';
            case 2: return 'Xayda';
            default: return `Hành tinh ${planetId}`;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Chọn Map</CardTitle>
                    <CardDescription>Đang tải danh sách map...</CardDescription>
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
                <CardTitle>Chọn Map</CardTitle>
                <CardDescription>
                    Chọn các map mà boss có thể xuất hiện
                    {selectedMaps.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {selectedMaps.length} map đã chọn
                        </Badge>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Search */}
                    <div className="space-y-2">
                        <Label htmlFor="map-search">Tìm kiếm map</Label>
                        <Input
                            id="map-search"
                            placeholder="Nhập tên map để tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Maps List */}
                    <div className="max-h-96 overflow-y-auto">
                        {filteredMaps.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                {searchTerm ? 'Không tìm thấy map nào' : 'Không có map nào'}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Selected Maps Section */}
                                {selectedMaps.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Map đã chọn ({selectedMaps.length})
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                            {filteredMaps
                                                .filter(map => selectedMaps.includes(map.id))
                                                .map((map) => (
                                                    <div
                                                        key={map.id}
                                                        className="relative p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer bg-green-50 border-green-200"
                                                        onClick={() => handleMapToggle(map.id)}
                                                    >
                                                        {/* Checkmark overlay */}
                                                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>

                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`map-${map.id}`}
                                                                checked={true}
                                                                onCheckedChange={() => handleMapToggle(map.id)}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <Label
                                                                    htmlFor={`map-${map.id}`}
                                                                    className="text-sm font-medium cursor-pointer block truncate text-green-900"
                                                                >
                                                                    {map.NAME}
                                                                </Label>
                                                                <div className="text-xs text-green-600 mt-1">
                                                                    {getPlanetName(map.planet_id)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Available Maps Section */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Map có thể chọn ({filteredMaps.filter(map => !selectedMaps.includes(map.id)).length})
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {filteredMaps
                                            .filter(map => !selectedMaps.includes(map.id))
                                            .map((map) => (
                                                <div
                                                    key={map.id}
                                                    className="relative p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                                    onClick={() => handleMapToggle(map.id)}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`map-${map.id}`}
                                                            checked={false}
                                                            onCheckedChange={() => handleMapToggle(map.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <Label
                                                                htmlFor={`map-${map.id}`}
                                                                className="text-sm font-medium cursor-pointer block truncate"
                                                            >
                                                                {map.NAME}
                                                            </Label>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {getPlanetName(map.planet_id)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected Maps Summary */}
                    {selectedMaps.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">
                                Map đã chọn ({selectedMaps.length}):
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {selectedMaps.map((mapId) => {
                                    const map = maps.find(m => m.id === mapId);
                                    return (
                                        <div key={mapId} className="flex items-center space-x-2 p-2 bg-white rounded border">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="text-xs font-medium truncate">
                                                {map?.NAME || `Map ${mapId}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
