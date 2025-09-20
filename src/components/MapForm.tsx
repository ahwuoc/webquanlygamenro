'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Form, Input, InputNumber, Select, Button, message, Space, Divider, Table, Popconfirm } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

interface MapFormProps {
    mapId: number;
    initialData: any;
}

interface NPC {
    id: number;
    x: number;
    y: number;
}

interface Mob {
    id: number;
    level: number;
    hp: number;
    x: number;
    y: number;
}

interface MobTemplate {
    id: number;
    NAME: string;
    TYPE: number;
    hp: number;
}

interface NPCTemplate {
    id: number;
    NAME: string;
    head: number;
    body: number;
    leg: number;
    avatar: number;
}

export default function MapForm({ mapId, initialData }: MapFormProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [npcs, setNpcs] = useState<NPC[]>([]);
    const [mobs, setMobs] = useState<Mob[]>([]);
    const [mobTemplates, setMobTemplates] = useState<MobTemplate[]>([]);
    const [npcTemplates, setNpcTemplates] = useState<NPCTemplate[]>([]);
    const router = useRouter();

    useEffect(() => {
        // Fetch mob and npc templates
        const fetchTemplates = async () => {
            try {
                const [mobResponse, npcResponse] = await Promise.all([
                    fetch('/api/mob-templates?limit=1000'),
                    fetch('/api/npc-templates?limit=1000')
                ]);

                if (mobResponse.ok) {
                    const mobData = await mobResponse.json();
                    setMobTemplates(mobData.mobs || []);
                }

                if (npcResponse.ok) {
                    const npcData = await npcResponse.json();
                    setNpcTemplates(npcData.npcs || []);
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
            }
        };

        fetchTemplates();

        // Parse NPCs from initial data
        try {
            const npcsData = JSON.parse(initialData.npcs || '[]');
            const parsedNpcs = npcsData.map((npc: number[]) => ({
                id: npc[0] || 0,
                x: npc[1] || 0,
                y: npc[2] || 0,
            }));
            setNpcs(parsedNpcs);
        } catch {
            setNpcs([]);
        }

        // Parse Mobs from initial data
        try {
            const mobsData = JSON.parse(initialData.mobs || '[]');
            const parsedMobs = mobsData.map((mob: number[]) => ({
                id: mob[0] || 0,
                level: mob[1] || 1,
                hp: mob[2] || 100,
                x: mob[3] || 0,
                y: mob[4] || 0,
            }));
            setMobs(parsedMobs);
        } catch {
            setMobs([]);
        }

        // Set form values với dữ liệu ban đầu
        form.setFieldsValue({
            id: initialData.id,
            NAME: initialData.NAME,
            zones: initialData.zones,
            max_player: initialData.max_player,
            type: initialData.type,
            planet_id: initialData.planet_id,
            bg_type: initialData.bg_type,
            tile_id: initialData.tile_id,
            bg_id: initialData.bg_id,
            data: initialData.data,
            waypoints: initialData.waypoints,
        });
    }, [initialData, form]);

    const addNpc = () => {
        const newNpc: NPC = { id: 0, x: 0, y: 0 };
        setNpcs([...npcs, newNpc]);
    };

    const removeNpc = (index: number) => {
        const newNpcs = npcs.filter((_, i) => i !== index);
        setNpcs(newNpcs);
    };

    const updateNpc = (index: number, field: keyof NPC, value: number) => {
        const newNpcs = [...npcs];
        newNpcs[index] = { ...newNpcs[index], [field]: value };
        setNpcs(newNpcs);
    };

    const addMob = () => {
        const newMob: Mob = { id: 0, level: 1, hp: 100, x: 0, y: 0 };
        setMobs([...mobs, newMob]);
    };

    const removeMob = (index: number) => {
        const newMobs = mobs.filter((_, i) => i !== index);
        setMobs(newMobs);
    };

    const updateMob = (index: number, field: keyof Mob, value: number) => {
        const newMobs = [...mobs];
        newMobs[index] = { ...newMobs[index], [field]: value };
        setMobs(newMobs);
    };

    const convertNpcsToJson = () => {
        return JSON.stringify(npcs.map(npc => [npc.id, npc.x, npc.y]));
    };

    const convertMobsToJson = () => {
        return JSON.stringify(mobs.map(mob => [mob.id, mob.level, mob.hp, mob.x, mob.y]));
    };

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            const npcsJson = convertNpcsToJson();
            const mobsJson = convertMobsToJson();

            const response = await fetch(`/api/maps/${mapId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...values,
                    npcs: npcsJson,
                    mobs: mobsJson,
                }),
            });

            if (response.ok) {
                message.success('Cập nhật map thành công!');
                router.push(`/maps/${mapId}`);
            } else {
                const errorData = await response.json();
                message.error(errorData.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            message.error('Có lỗi xảy ra khi lưu map');
        } finally {
            setLoading(false);
        }
    };

    const planetOptions = [
        { value: 0, label: 'Trái Đất' },
        { value: 1, label: 'Namek' },
        { value: 2, label: 'Xayda' },
    ];

    const typeOptions = [
        { value: 0, label: 'Thường' },
        { value: 1, label: 'PvP' },
        { value: 2, label: 'Boss' },
        { value: 3, label: 'Event' },
    ];

    const npcColumns = [
        {
            title: 'NPC',
            dataIndex: 'id',
            key: 'id',
            width: 250,
            render: (value: number, record: NPC, index: number) => (
                <Select
                    value={value}
                    onChange={(val) => updateNpc(index, 'id', val || 0)}
                    showSearch
                    placeholder="Chọn NPC"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ width: '100%' }}
                    size="small"
                    options={npcTemplates.map(npc => ({
                        value: npc.id,
                        label: `${npc.NAME} (ID: ${npc.id})`,
                    }))}
                />
            ),
        },
        {
            title: 'Vị Trí X',
            dataIndex: 'x',
            key: 'x',
            width: 100,
            render: (value: number, record: NPC, index: number) => (
                <InputNumber
                    value={value}
                    onChange={(val) => updateNpc(index, 'x', val || 0)}
                    min={0}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'Vị Trí Y',
            dataIndex: 'y',
            key: 'y',
            width: 100,
            render: (value: number, record: NPC, index: number) => (
                <InputNumber
                    value={value}
                    onChange={(val) => updateNpc(index, 'y', val || 0)}
                    min={0}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'Hành Động',
            key: 'action',
            width: 80,
            render: (value: any, record: NPC, index: number) => (
                <Popconfirm
                    title="Xóa NPC này?"
                    onConfirm={() => removeNpc(index)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    const mobColumns = [
        {
            title: 'Mob',
            dataIndex: 'id',
            key: 'id',
            width: 250,
            render: (value: number, record: Mob, index: number) => (
                <Select
                    value={value}
                    onChange={(val) => updateMob(index, 'id', val || 0)}
                    showSearch
                    placeholder="Chọn Mob"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ width: '100%' }}
                    size="small"
                    options={mobTemplates.map(mob => ({
                        value: mob.id,
                        label: `${mob.NAME} (ID: ${mob.id})`,
                    }))}
                />
            ),
        },
        {
            title: 'Level',
            dataIndex: 'level',
            key: 'level',
            width: 80,
            render: (value: number, record: Mob, index: number) => (
                <InputNumber
                    value={value}
                    onChange={(val) => updateMob(index, 'level', val || 1)}
                    min={1}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'HP',
            dataIndex: 'hp',
            key: 'hp',
            width: 100,
            render: (value: number, record: Mob, index: number) => (
                <InputNumber
                    value={value}
                    onChange={(val) => updateMob(index, 'hp', val || 100)}
                    min={1}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'Vị Trí X',
            dataIndex: 'x',
            key: 'x',
            width: 100,
            render: (value: number, record: Mob, index: number) => (
                <InputNumber
                    value={value}
                    onChange={(val) => updateMob(index, 'x', val || 0)}
                    min={0}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'Vị Trí Y',
            dataIndex: 'y',
            key: 'y',
            width: 100,
            render: (value: number, record: Mob, index: number) => (
                <InputNumber
                    value={value}
                    onChange={(val) => updateMob(index, 'y', val || 0)}
                    min={0}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'Hành Động',
            key: 'action',
            width: 80,
            render: (value: any, record: Mob, index: number) => (
                <Popconfirm
                    title="Xóa Mob này?"
                    onConfirm={() => removeMob(index)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Chỉnh Sửa Map</h1>
                            <p className="mt-2 text-gray-600">Cập nhật thông tin map: {initialData.NAME}</p>
                        </div>
                        <Button icon={<ArrowLeftOutlined />}>
                            <Link href={`/maps/${mapId}`}>Quay Lại</Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Thông Tin Cơ Bản</h3>

                                <Form.Item
                                    label="ID Map"
                                    name="id"
                                >
                                    <InputNumber
                                        className="w-full"
                                        disabled
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Tên Map"
                                    name="NAME"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập tên map' },
                                        { max: 55, message: 'Tên map không được quá 55 ký tự' }
                                    ]}
                                >
                                    <Input placeholder="Nhập tên map" />
                                </Form.Item>

                                <Form.Item
                                    label="Số Zone"
                                    name="zones"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập số zone' },
                                        { type: 'number', min: 1, message: 'Số zone phải lớn hơn 0' }
                                    ]}
                                >
                                    <InputNumber className="w-full" placeholder="Nhập số zone" />
                                </Form.Item>

                                <Form.Item
                                    label="Max Player"
                                    name="max_player"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập max player' },
                                        { type: 'number', min: 1, message: 'Max player phải lớn hơn 0' }
                                    ]}
                                >
                                    <InputNumber className="w-full" placeholder="Nhập max player" />
                                </Form.Item>
                            </div>

                            {/* Map Configuration */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Cấu Hình Map</h3>

                                <Form.Item
                                    label="Hành Tinh"
                                    name="planet_id"
                                    rules={[{ required: true, message: 'Vui lòng chọn hành tinh' }]}
                                >
                                    <Select placeholder="Chọn hành tinh">
                                        {planetOptions.map(option => (
                                            <Option key={option.value} value={option.value}>
                                                {option.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    label="Loại Map"
                                    name="type"
                                    rules={[{ required: true, message: 'Vui lòng chọn loại map' }]}
                                >
                                    <Select placeholder="Chọn loại map">
                                        {typeOptions.map(option => (
                                            <Option key={option.value} value={option.value}>
                                                {option.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                            </div>
                        </div>

                        <Divider />

                        {/* NPCs Management */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Quản Lý NPCs</h3>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={addNpc}
                                >
                                    Thêm NPC
                                </Button>
                            </div>

                            <Table
                                columns={npcColumns}
                                dataSource={npcs}
                                rowKey={(record, index) => `npc-${index}`}
                                pagination={false}
                                size="small"
                                locale={{ emptyText: 'Chưa có NPC nào' }}
                            />

                            <div className="mt-4 text-sm text-gray-500">
                                <p><strong>Hướng dẫn:</strong></p>
                                <p>• NPC: Chọn từ danh sách NPC có sẵn, có thể search theo tên</p>
                                <p>• Vị Trí X: Tọa độ X trên map</p>
                                <p>• Vị Trí Y: Tọa độ Y trên map</p>
                            </div>
                        </div>

                        <Divider />

                        {/* Mobs Management */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Quản Lý Mobs</h3>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={addMob}
                                >
                                    Thêm Mob
                                </Button>
                            </div>

                            <Table
                                columns={mobColumns}
                                dataSource={mobs}
                                rowKey={(record, index) => `mob-${index}`}
                                pagination={false}
                                size="small"
                                scroll={{ x: 700 }}
                                locale={{ emptyText: 'Chưa có Mob nào' }}
                            />

                            <div className="mt-4 text-sm text-gray-500">
                                <p><strong>Hướng dẫn:</strong></p>
                                <p>• Mob: Chọn từ danh sách Mob có sẵn, có thể search theo tên</p>
                                <p>• Level: Cấp độ của Mob</p>
                                <p>• HP: Máu của Mob</p>
                                <p>• Vị Trí X: Tọa độ X trên map</p>
                                <p>• Vị Trí Y: Tọa độ Y trên map</p>
                            </div>
                        </div>

                        <Divider />

                        {/* Submit Button */}
                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                    size="large"
                                >
                                    Cập Nhật Map
                                </Button>
                                <Button
                                    onClick={() => router.push(`/maps/${mapId}`)}
                                    size="large"
                                >
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </div>
    );
}