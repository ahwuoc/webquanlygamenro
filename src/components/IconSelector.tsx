'use client';

import { useState, useEffect } from 'react';
import { Select, Input, Button, Space, Typography, Card, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

interface ItemTemplate {
    id: number;
    NAME: string;
    icon_id: number;
    TYPE?: number;
    description?: string;
}

interface IconSelectorProps {
    label?: string;
    placeholder?: string;
    value?: number; // icon_id value
    onChange?: (iconId: number) => void;
    disabled?: boolean;
    showPreview?: boolean;
    items?: ItemTemplate[]; // item_template list
}

export default function IconSelector({
    label = "Icon Spec",
    placeholder = "Chọn item template...",
    value,
    onChange,
    disabled = false,
    showPreview = true,
    items = []
}: IconSelectorProps) {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<ItemTemplate | null>(null);

    useEffect(() => {
        if (value && items.length > 0) {
            // Find item by icon_id that matches the value (icon_spec)
            const item = items.find(i => i.icon_id === value);
            setSelectedItem(item || null);
        } else if (value === 0 || !value) {
            setSelectedItem(null);
        }
    }, [value, items]);

    const filteredItems = items.filter(item =>
        item.NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toString().includes(searchTerm) ||
        item.icon_id?.toString().includes(searchTerm)
    );

    const handleItemChange = (itemId: number) => {
        const item = items.find(i => i.id === itemId);
        setSelectedItem(item || null);
        // Return the icon_id of the selected item_template
        onChange?.(item?.icon_id || 0);
    };

    const handleRefresh = () => {
        setLoading(true);
        // Simulate refresh - in real app, this would refetch items
        setTimeout(() => {
            setLoading(false);
        }, 500);
    };

    return (
        <div className="space-y-2">
            <Typography.Text strong>{label}</Typography.Text>

            <Space.Compact className="w-full">
                <Select
                    showSearch
                    placeholder={placeholder}
                    value={selectedItem?.id}
                    onChange={handleItemChange}
                    disabled={disabled}
                    loading={loading}
                    filterOption={false}
                    onSearch={setSearchTerm}
                    style={{ width: '100%' }}
                    options={filteredItems.slice(0, 100).map(item => ({
                        label: `${item.NAME || 'Unknown'} (#${item.id}) - Icon: ${item.icon_id || 'N/A'}`,
                        value: item.id,
                        key: item.id
                    }))}
                    popupRender={(menu) => (
                        <div>
                            <div className="p-2 border-b">
                                <Input
                                    placeholder="Tìm theo tên hoặc ID item template..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    prefix={<SearchOutlined />}
                                    suffix={
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ReloadOutlined />}
                                            onClick={handleRefresh}
                                        />
                                    }
                                />
                            </div>
                            {menu}
                            <div className="p-2 border-t text-xs text-gray-500">
                                Hiển thị {Math.min(filteredItems.length, 100)} / {items.length} items
                            </div>
                        </div>
                    )}
                />
            </Space.Compact>

            {showPreview && selectedItem && (
                <Card size="small" className="mt-2">
                    <Row gutter={8} align="middle">
                        <Col>
                            <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center text-xs">
                                {selectedItem.icon_id}
                            </div>
                        </Col>
                        <Col flex="auto">
                            <Typography.Text type="secondary" className="text-xs">
                                {selectedItem.NAME} (ID: {selectedItem.id})
                            </Typography.Text>
                            <br />
                            <Typography.Text type="secondary" className="text-xs">
                                Icon ID: {selectedItem.icon_id || 'N/A'}
                            </Typography.Text>
                        </Col>
                    </Row>
                </Card>
            )}
        </div>
    );
}
