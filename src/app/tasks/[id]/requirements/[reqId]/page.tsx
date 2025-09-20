"use client";

import React, { useEffect, useState } from "react";
import { Card, Button, Space, Typography, Spin, message, Row, Col, Tag, Breadcrumb, Form, InputNumber, Select, Switch, Input } from "antd";
import { ArrowLeftOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { requirementsService } from "@/lib/api/requirements.service";
import { tasksService } from "@/lib/api/tasks.service";
import { useTemplateMapping } from '@/lib/api/templateMapping.service';
import RewardsManager from "@/components/RewardsManager";

const { Title, Text } = Typography;

interface Requirement {
    id: number;
    task_main_id: number;
    task_sub_id: number;
    requirement_type: string;
    target_id: number;
    target_count: number;
    map_restriction?: string | null;
    extra_data?: string | null;
    is_active: boolean;
}

export default function RequirementEditPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = parseInt(params?.id as string || '0');
    const reqId = parseInt(params?.reqId as string || '0');
    const { getDisplayName } = useTemplateMapping();

    const [loading, setLoading] = useState(true);
    const [requirement, setRequirement] = useState<Requirement | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [existingSubIds, setExistingSubIds] = useState<number[]>([]);
    const [taskInfo, setTaskInfo] = useState<{ id: number; NAME: string; detail: string } | null>(null);

    useEffect(() => {
        const fetchRequirement = async () => {
            try {
                setLoading(true);
                const req = await requirementsService.get(reqId);
                setRequirement(req);

                // Load task info
                const task = await tasksService.get(req.task_main_id);
                setTaskInfo(task);

                const existingReqs = await requirementsService.list({
                    task_main_id: req.task_main_id
                });
                const subIds = existingReqs.requirements
                    .map(r => r.task_sub_id)
                    .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
                    .sort((a, b) => a - b);
                setExistingSubIds(subIds);
            } catch (error: any) {
                console.error(error);
                message.error(error.message || "Không thể tải requirement");
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (reqId) {
            fetchRequirement();
        }
    }, [reqId, router]);

    const getRequirementTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            KILL_MOB: "Giết quái",
            KILL_BOSS: "Giết boss",
            TALK_NPC: "Nói chuyện NPC",
            PICK_ITEM: "Nhặt vật phẩm",
            GO_TO_MAP: "Đến map",
            USE_ITEM: "Sử dụng vật phẩm"
        };
        return labels[type] || type;
    };

    const getRequirementTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            KILL_MOB: "blue",
            KILL_BOSS: "red",
            TALK_NPC: "green",
            PICK_ITEM: "orange",
            GO_TO_MAP: "purple",
            USE_ITEM: "cyan"
        };
        return colors[type] || "default";
    };

    const getNextAvailableSubId = () => {
        if (existingSubIds.length === 0) return 0;
        const maxId = Math.max(...existingSubIds);
        return maxId + 1;
    };

    const validateSubId = (_: any, value: number) => {
        if (value === undefined || value === null) {
            return Promise.reject(new Error('Vui lòng nhập Sub ID'));
        }

        if (value < 0) {
            return Promise.reject(new Error('Sub ID phải >= 0'));
        }

        // Check if Sub ID already exists (excluding current requirement)
        const currentSubId = requirement?.task_sub_id;
        if (existingSubIds.includes(value) && value !== currentSubId) {
            return Promise.reject(new Error(`Sub ID ${value} đã tồn tại. Các Sub ID hiện có: ${existingSubIds.join(', ')}`));
        }

        return Promise.resolve();
    };

    const handleEdit = () => {
        if (requirement) {
            form.setFieldsValue({
                task_sub_id: requirement.task_sub_id,
                requirement_type: requirement.requirement_type,
                target_id: requirement.target_id,
                target_count: requirement.target_count,
                map_restriction: requirement.map_restriction,
                extra_data: requirement.extra_data,
                is_active: requirement.is_active
            });
            setIsEditing(true);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        form.resetFields();
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const values = await form.validateFields();

            const updatedRequirement = await requirementsService.update(reqId, {
                task_sub_id: values.task_sub_id,
                requirement_type: values.requirement_type,
                target_id: values.target_id,
                target_count: values.target_count,
                map_restriction: values.map_restriction || null,
                extra_data: values.extra_data || null,
                is_active: values.is_active
            });

            setRequirement(updatedRequirement);
            setIsEditing(false);
            message.success('Requirement đã được cập nhật thành công!');
        } catch (error: any) {
            console.error(error);
            message.error(error.message || 'Không thể cập nhật requirement');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!requirement) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Text type="secondary">Không tìm thấy requirement</Text>
                </div>
            </Card>
        );
    }

    return (
        <div style={{ maxWidth: '100%', padding: '0 16px' }}>
            <Breadcrumb
                style={{ marginBottom: 16 }}
                items={[
                    {
                        title: (
                            <Button type="link" onClick={() => router.push('/tasks')} style={{ padding: 0 }}>
                                Tasks
                            </Button>
                        )
                    },
                    {
                        title: (
                            <Button type="link" onClick={() => router.push(`/tasks/${taskId}`)} style={{ padding: 0 }}>
                                Task #{taskId}
                            </Button>
                        )
                    },
                    {
                        title: `Requirement #${reqId}`
                    }
                ]}
            />

            <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                    <Col>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => router.back()}
                            >
                                Quay lại
                            </Button>
                            <Title level={3} style={{ margin: 0 }}>
                                Requirement #{reqId}
                            </Title>
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            {!isEditing ? (
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={handleEdit}
                                >
                                    Chỉnh sửa
                                </Button>
                            ) : (
                                <>
                                    <Button onClick={handleCancel}>
                                        Hủy
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        loading={saving}
                                        onClick={handleSave}
                                    >
                                        Lưu thay đổi
                                    </Button>
                                </>
                            )}
                        </Space>
                    </Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card title="Thông tin Requirement" size="small">
                            <Form form={form} layout="vertical">
                                <Row gutter={[16, 16]}>
                                    <Col span={6}>
                                        <Text strong>ID:</Text>
                                        <br />
                                        <Text>{requirement.id}</Text>
                                    </Col>
                                    <Col span={6}>
                                        <Text strong>Task Main ID:</Text>
                                        <br />
                                        {taskInfo ? (
                                            <div>
                                                <Tag color="blue">#{taskInfo.id}</Tag>
                                                <br />
                                                <Text strong style={{ fontSize: '14px' }}>{taskInfo.NAME}</Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {taskInfo.detail}
                                                </Text>
                                            </div>
                                        ) : (
                                            <Text>{requirement.task_main_id}</Text>
                                        )}
                                    </Col>
                                    <Col span={6}>
                                        <Text strong>Task Sub ID:</Text>
                                        <br />
                                        {isEditing ? (
                                            <Form.Item
                                                name="task_sub_id"
                                                style={{ margin: 0 }}
                                                rules={[{ validator: validateSubId }]}
                                            >
                                                <InputNumber
                                                    min={0}
                                                    style={{ width: '100%' }}
                                                    placeholder={`Gợi ý: ${getNextAvailableSubId()}`}
                                                />
                                            </Form.Item>
                                        ) : (
                                            <Tag color="blue">Nhiệm vụ Con {requirement.task_sub_id}</Tag>
                                        )}
                                        {isEditing && (
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                <Text type="secondary">
                                                    Sub IDs hiện có: {existingSubIds.join(', ')} |
                                                    Gợi ý tiếp theo: {getNextAvailableSubId()}
                                                </Text>
                                            </div>
                                        )}
                                    </Col>
                                    <Col span={6}>
                                        <Text strong>Loại Requirement:</Text>
                                        <br />
                                        {isEditing ? (
                                            <Form.Item name="requirement_type" style={{ margin: 0 }}>
                                                <Select style={{ width: '100%' }}>
                                                    <Select.Option value="KILL_MOB">KILL_MOB</Select.Option>
                                                    <Select.Option value="KILL_BOSS">KILL_BOSS</Select.Option>
                                                    <Select.Option value="TALK_NPC">TALK_NPC</Select.Option>
                                                    <Select.Option value="PICK_ITEM">PICK_ITEM</Select.Option>
                                                    <Select.Option value="GO_TO_MAP">GO_TO_MAP</Select.Option>
                                                    <Select.Option value="USE_ITEM">USE_ITEM</Select.Option>
                                                </Select>
                                            </Form.Item>
                                        ) : (
                                            <Tag color={getRequirementTypeColor(requirement.requirement_type)}>
                                                {getRequirementTypeLabel(requirement.requirement_type)}
                                            </Tag>
                                        )}
                                    </Col>
                                    <Col span={6}>
                                        <Text strong>Target ID:</Text>
                                        <br />
                                        {isEditing ? (
                                            <Form.Item name="target_id" style={{ margin: 0 }}>
                                                <InputNumber min={0} style={{ width: '100%' }} />
                                            </Form.Item>
                                        ) : (
                                            <div>
                                                <Text>{requirement.target_id}</Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {getDisplayName(requirement.requirement_type, requirement.target_id)}
                                                </Text>
                                            </div>
                                        )}
                                    </Col>
                                    <Col span={6}>
                                        <Text strong>Số lượng:</Text>
                                        <br />
                                        {isEditing ? (
                                            <Form.Item name="target_count" style={{ margin: 0 }}>
                                                <InputNumber min={1} style={{ width: '100%' }} />
                                            </Form.Item>
                                        ) : (
                                            <Text>{requirement.target_count}</Text>
                                        )}
                                    </Col>
                                    <Col span={6}>
                                        <Text strong>Map Restriction:</Text>
                                        <br />
                                        {isEditing ? (
                                            <Form.Item name="map_restriction" style={{ margin: 0 }}>
                                                <Input placeholder="Ví dụ: 3, 1-5, !10" />
                                            </Form.Item>
                                        ) : (
                                            <Text>{requirement.map_restriction || "Không có"}</Text>
                                        )}
                                        {isEditing && (
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                <Text type="secondary">
                                                    <div><strong>Cú pháp hỗ trợ:</strong></div>
                                                    <div>• <code>3</code> - Chỉ map 3</div>
                                                    <div>• <code>1,2,3</code> - Map 1 hoặc 2 hoặc 3</div>
                                                    <div>• <code>1-5</code> - Map từ 1 đến 5</div>
                                                    <div>• <code>1-3,10,15-20</code> - Map 1-3, map 10, map 15-20</div>
                                                    <div>• <code>!10</code> - Tất cả map trừ map 10</div>
                                                    <div>• <code>!5-10</code> - Tất cả map trừ map 5-10</div>
                                                    <div>• <code>Để trống</code> - Không giới hạn map</div>
                                                </Text>
                                            </div>
                                        )}
                                    </Col>
                                    <Col span={6}>
                                        <Text strong>Trạng thái:</Text>
                                        <br />
                                        {isEditing ? (
                                            <Form.Item name="is_active" style={{ margin: 0 }} valuePropName="checked">
                                                <Switch />
                                            </Form.Item>
                                        ) : (
                                            <Tag color={requirement.is_active ? "green" : "red"}>
                                                {requirement.is_active ? "Hoạt động" : "Không hoạt động"}
                                            </Tag>
                                        )}
                                    </Col>
                                    <Col span={24}>
                                        <Text strong>Extra Data:</Text>
                                        <br />
                                        {isEditing ? (
                                            <Form.Item name="extra_data" style={{ margin: 0 }}>
                                                <Input.TextArea rows={3} placeholder="JSON data" />
                                            </Form.Item>
                                        ) : (
                                            requirement.extra_data ? (
                                                <Text code style={{ whiteSpace: 'pre-wrap' }}>
                                                    {requirement.extra_data}
                                                </Text>
                                            ) : (
                                                <Text type="secondary">Không có</Text>
                                            )
                                        )}
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </Card>

            <div style={{ marginTop: 24 }}>
                <RewardsManager taskMainId={taskId} requirementId={reqId} />
            </div>
        </div>
    );
}
