'use client';

import { useState, useEffect } from 'react';
import { Card, Checkbox, Input, Tag, Button, Space, Divider, Empty, Spin } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

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
                const response = await fetch('/api/maps?limit=all');
                if (response.ok) {
                    const responseData = await response.json();
                    setMaps(responseData.maps || responseData);
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

    const handleSelectAll = () => {
        const allMapIds = filteredMaps.map(map => map.id);
        setSelectedMaps(allMapIds);
        onChange(JSON.stringify(allMapIds));
    };

    const handleClearAll = () => {
        setSelectedMaps([]);
        onChange(JSON.stringify([]));
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

    const getPlanetColor = (planetId: number) => {
        switch (planetId) {
            case 0: return 'blue';
            case 1: return 'green';
            case 2: return 'orange';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Card title="Chọn Map">
                <div className="text-center py-8">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-500">Đang tải danh sách map...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card
            title="Chọn Map"
            extra={
                <Space>
                    {selectedMaps.length > 0 && (
                        <Tag color="blue" icon={<CheckCircleOutlined />}>
                            {selectedMaps.length} map đã chọn
                        </Tag>
                    )}
                    <Button size="small" onClick={handleSelectAll} disabled={filteredMaps.length === 0}>
                        Chọn tất cả
                    </Button>
                    <Button size="small" onClick={handleClearAll} disabled={selectedMaps.length === 0}>
                        Bỏ chọn tất cả
                    </Button>
                </Space>
            }
        >
            <div className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                    <label htmlFor="map-search" className="block text-sm font-medium text-gray-700">
                        Tìm kiếm map
                    </label>
                    <Input
                        id="map-search"
                        placeholder="Nhập tên map để tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        prefix={<SearchOutlined />}
                        allowClear
                    />
                </div>

                {/* Maps List */}
                <div className="max-h-96 overflow-y-auto">
                    {filteredMaps.length === 0 ? (
                        <Empty
                            description={searchTerm ? 'Không tìm thấy map nào' : 'Không có map nào'}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : (
                        <div className="space-y-4">
                            {/* Maps Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredMaps.map((map) => {
                                    const isSelected = selectedMaps.includes(map.id);
                                    return (
                                        <div
                                            key={map.id}
                                            className={`relative p-3 border rounded-lg transition-all duration-200 cursor-pointer ${isSelected
                                                ? 'bg-green-50 border-green-300 shadow-sm'
                                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                                }`}
                                            onClick={() => handleMapToggle(map.id)}
                                        >
                                            {/* Selection indicator */}
                                            <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${isSelected ? 'bg-green-500' : 'bg-gray-300'
                                                }`}>
                                                {isSelected ? (
                                                    <CheckCircleOutlined className="text-white text-xs" />
                                                ) : (
                                                    <CloseCircleOutlined className="text-white text-xs" />
                                                )}
                                            </div>

                                            <div className="flex items-start space-x-3 pr-8">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => handleMapToggle(map.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-medium truncate ${isSelected ? 'text-green-900' : 'text-gray-900'
                                                        }`}>
                                                        {map.NAME}
                                                    </div>
                                                    <div className="mt-1">
                                                        <Tag
                                                            color={getPlanetColor(map.planet_id)}
                                                        >
                                                            {getPlanetName(map.planet_id)}
                                                        </Tag>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        ID: {map.id} • Zones: {map.zones} • Max: {map.max_player}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Selected Maps Summary */}
                {selectedMaps.length > 0 && (
                    <>
                        <Divider />
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                                <CheckCircleOutlined className="mr-2" />
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
                    </>
                )}

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}
            </div>
        </Card>
    );
}
