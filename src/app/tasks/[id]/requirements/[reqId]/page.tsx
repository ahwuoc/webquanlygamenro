"use client";

import React, { useEffect, useState } from "react";
import { Card, Button, Space, Typography, Spin, message, Row, Col, Tag, Breadcrumb } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { requirementsService } from "@/lib/api/requirements.service";
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
    const taskId = parseInt(params.id as string);
    const reqId = parseInt(params.reqId as string);

    const [loading, setLoading] = useState(true);
    const [requirement, setRequirement] = useState<Requirement | null>(null);

    useEffect(() => {
        const fetchRequirement = async () => {
            try {
                setLoading(true);
                const req = await requirementsService.get(reqId);
                setRequirement(req);
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
        <div>
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item>
                    <Button type="link" onClick={() => router.push('/tasks')} style={{ padding: 0 }}>
                        Tasks
                    </Button>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Button type="link" onClick={() => router.push(`/tasks/${taskId}`)} style={{ padding: 0 }}>
                        Task #{taskId}
                    </Button>
                </Breadcrumb.Item>
                <Breadcrumb.Item>Requirement #{reqId}</Breadcrumb.Item>
            </Breadcrumb>

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
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => router.push(`/tasks/${taskId}/requirements/${reqId}/edit`)}
                        >
                            Chỉnh sửa Requirement
                        </Button>
                    </Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <Card title="Thông tin Requirement" size="small">
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Text strong>ID:</Text>
                                    <br />
                                    <Text>{requirement.id}</Text>
                                </Col>
                                <Col span={12}>
                                    <Text strong>Task Main ID:</Text>
                                    <br />
                                    <Text>{requirement.task_main_id}</Text>
                                </Col>
                                <Col span={12}>
                                    <Text strong>Task Sub ID:</Text>
                                    <br />
                                    <Text>{requirement.task_sub_id}</Text>
                                </Col>
                                <Col span={12}>
                                    <Text strong>Loại Requirement:</Text>
                                    <br />
                                    <Tag color={getRequirementTypeColor(requirement.requirement_type)}>
                                        {getRequirementTypeLabel(requirement.requirement_type)}
                                    </Tag>
                                </Col>
                                <Col span={12}>
                                    <Text strong>Target ID:</Text>
                                    <br />
                                    <Text>{requirement.target_id}</Text>
                                </Col>
                                <Col span={12}>
                                    <Text strong>Số lượng:</Text>
                                    <br />
                                    <Text>{requirement.target_count}</Text>
                                </Col>
                                <Col span={24}>
                                    <Text strong>Map Restriction:</Text>
                                    <br />
                                    <Text>{requirement.map_restriction || "Không có"}</Text>
                                </Col>
                                <Col span={24}>
                                    <Text strong>Extra Data:</Text>
                                    <br />
                                    <Text code style={{ whiteSpace: 'pre-wrap' }}>
                                        {requirement.extra_data || "Không có"}
                                    </Text>
                                </Col>
                                <Col span={12}>
                                    <Text strong>Trạng thái:</Text>
                                    <br />
                                    <Tag color={requirement.is_active ? "green" : "red"}>
                                        {requirement.is_active ? "Hoạt động" : "Không hoạt động"}
                                    </Tag>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    <Col span={12}>
                        <Card title="Phần thưởng (Rewards)" size="small">
                            <RewardsManager taskMainId={taskId} requirementId={reqId} />
                        </Card>
                    </Col>
                </Row>
            </Card>
        </div>
    );
}
