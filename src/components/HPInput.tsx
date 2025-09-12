'use client';

import { useState, useEffect } from 'react';
import { Input, Button, Card, Tag, Space, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

interface HPInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export default function HPInput({ value, onChange, error }: HPInputProps) {
    const [hpValues, setHpValues] = useState<number[]>([]);

    useEffect(() => {
        try {
            const parsedValue = JSON.parse(value || '[]');
            if (Array.isArray(parsedValue)) {
                setHpValues(parsedValue);
            } else {
                setHpValues([]);
            }
        } catch {
            setHpValues([]);
        }
    }, [value]);

    const addHPLevel = () => {
        const newValues = [...hpValues, 0];
        setHpValues(newValues);
        onChange(JSON.stringify(newValues));
    };

    const removeHPLevel = (index: number) => {
        const newValues = hpValues.filter((_, i) => i !== index);
        setHpValues(newValues);
        onChange(JSON.stringify(newValues));
    };

    const updateHPValue = (index: number, newValue: number) => {
        const newValues = [...hpValues];
        newValues[index] = newValue;
        setHpValues(newValues);
        onChange(JSON.stringify(newValues));
    };

    return (
        <Card
            title="Cấu hình HP theo Level"
            extra={
                <Space>
                    <Tag color="blue">{hpValues.length} level</Tag>
                    <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={addHPLevel}
                    >
                        Thêm Level
                    </Button>
                </Space>
            }
        >
            <div className="space-y-4">
                {hpValues.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>Chưa có level HP nào</p>
                        <p className="text-sm">Nhấn "Thêm Level" để bắt đầu</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {hpValues.map((hp, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0">
                                    <Tag color="red">Level {index + 1}</Tag>
                                </div>
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        value={hp}
                                        onChange={(e) => updateHPValue(index, parseInt(e.target.value) || 0)}
                                        placeholder="Nhập HP cho level này..."
                                        min="0"
                                        step="1"
                                        className="text-lg font-mono"
                                    />
                                </div>
                                <div className="flex-shrink-0">
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeHPLevel(index)}
                                        size="small"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {hpValues.length > 0 && (
                    <>
                        <Divider />
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">
                                Tóm tắt HP:
                            </h4>
                            <div className="text-sm text-blue-700">
                                <div className="font-mono">
                                    {JSON.stringify(hpValues)}
                                </div>
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
