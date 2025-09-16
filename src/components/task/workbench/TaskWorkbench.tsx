"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, Row, Col, Tree, Typography, Spin, Space, Button, Form, Input, InputNumber, message, Tag } from "antd";
import { ApartmentOutlined, BranchesOutlined, SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import { tasksService, TaskMain } from "@/lib/api/tasks.service";
import { subTasksService, SubTask } from "@/lib/api/subTasks.service";
import RequirementsManager from "@/components/RequirementsManager";
import RewardsManager from "@/components/RewardsManager";
import { NPC_TEMPLATES, npcNameById } from "@/lib/data/npcTemplates";
import { mapTemplatesService } from "@/lib/api/mapTemplates.service";
import { Select } from "antd";

const { Title, Text } = Typography;

type TreeNode = {
  title: React.ReactNode;
  key: string;
  isLeaf?: boolean;
  children?: TreeNode[];
};

export default function TaskWorkbench() {
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasks, setTasks] = useState<TaskMain[]>([]);
  const [subByTask, setSubByTask] = useState<Record<number, SubTask[]>>({});

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubTask | null>(null);

  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const [mapOptions, setMapOptions] = useState<{ value: number; label: string }[]>([]);

  // Load tasks
  useEffect(() => {
    (async () => {
      try {
        setLoadingTasks(true);
        const res = await tasksService.list(1, 100);
        setTasks(res.tasks);
      } catch (e: any) {
        console.error(e);
        message.error(e.message || "Không thể tải Tasks");
      } finally {
        setLoadingTasks(false);
      }
    })();
  }, []);

  // Load map templates
  useEffect(() => {
    (async () => {
      try {
        const res = await mapTemplatesService.list();
        setMapOptions(res.maps.map(m => ({ value: m.id, label: `${m.NAME} (#${m.id})` })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const loadSubForTask = async (taskId: number) => {
    if (subByTask[taskId]) return;
    try {
      const res = await subTasksService.list({ task_main_id: taskId, page: 1, limit: 100 });
      setSubByTask(prev => ({ ...prev, [taskId]: res.subTasks }));
    } catch (e: any) {
      console.error(e);
      message.error(e.message || `Không thể tải Sub Tasks cho Task #${taskId}`);
    }
  };

  const treeData: TreeNode[] = useMemo(() => {
    return tasks.map(t => ({
      key: `task-${t.id}`,
      title: (
        <Space>
          <Tag color="blue">#{t.id}</Tag>
          <Text strong>{t.NAME}</Text>
        </Space>
      ),
      children: (subByTask[t.id] || []).map((s) => ({
        key: `task-${t.id}-sub-${s.id}`,
        isLeaf: true,
        title: (
          <Space>
            <Tag>Sub #{s.id}</Tag>
            <Text>{s.NAME}</Text>
          </Space>
        ),
      })),
    }));
  }, [tasks, subByTask]);

  const onSelectTree = async (keys: any[]) => {
    const key = keys?.[0] as string | undefined;
    if (!key) return;
    const matchTask = key.match(/^task-(\d+)$/);
    const matchSub = key.match(/^task-(\d+)-sub-(\d+)$/);
    if (matchTask) {
      const taskId = Number(matchTask[1]);
      setSelectedTaskId(taskId);
      setSelectedSub(null);
      await loadSubForTask(taskId);
    } else if (matchSub) {
      const taskId = Number(matchSub[1]);
      const subId = Number(matchSub[2]);
      setSelectedTaskId(taskId);
      await loadSubForTask(taskId);
      const sub = (subByTask[taskId] || []).find(s => s.id === subId) || null;
      setSelectedSub(sub);
      if (sub) {
        form.setFieldsValue(sub);
        // Notify other panels to filter by this sub
        const ev = new CustomEvent('task-sub-select', { detail: { taskMainId: taskId, subId: sub.id, target: 'requirements' } });
        window.dispatchEvent(ev);
      }
    }
  };

  const onSaveSub = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedSub) return;
      setSaving(true);
      await subTasksService.update(selectedSub.id, values);
      message.success("Đã lưu Sub Task");
      // refresh list
      if (selectedTaskId) await loadSubForTask(selectedTaskId);
    } catch (e: any) {
      if (e?.errorFields) return;
      console.error(e);
      message.error(e.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-[1400px] mx-auto">
        <Row gutter={12}>
          {/* Left: Tree */}
          <Col xs={24} md={6}>
            <Card title={<Space><BranchesOutlined /> <span>Tasks → Sub Tasks</span></Space>} extra={<Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>Reload</Button>}>
              {loadingTasks ? (
                <div className="flex items-center justify-center py-8"><Spin /></div>
              ) : (
                <Tree
                  treeData={treeData}
                  showLine
                  onSelect={onSelectTree}
                  onExpand={async (keys) => {
                    const taskKeys = (keys as string[]).filter(k => /^task-\d+$/.test(k));
                    for (const k of taskKeys) {
                      const id = Number(k.replace('task-', ''));
                      await loadSubForTask(id);
                    }
                  }}
                />
              )}
            </Card>
          </Col>

          {/* Middle: Sub editor */}
          <Col xs={24} md={9}>
            <Card title={<Space><ApartmentOutlined /> <span>Sub Task Editor</span></Space>} extra={<Button type="primary" icon={<SaveOutlined />} onClick={onSaveSub} loading={saving} disabled={!selectedSub}>Lưu</Button>}>
              {selectedSub ? (
                <Form form={form} layout="vertical" initialValues={{ max_count: -1 }}>
                  <Form.Item label="ID" name="id">
                    <InputNumber disabled style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="Task Main ID" name="task_main_id">
                    <InputNumber disabled style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="Tên Sub Task" name="NAME" rules={[{ required: true, message: 'Nhập tên' }]}>
                    <Input placeholder="Tên Sub Task" />
                  </Form.Item>
                  <Form.Item label="Max Count" name="max_count">
                    <InputNumber style={{ width: '100%' }} placeholder="-1 nếu không giới hạn" />
                  </Form.Item>
                  <Form.Item label="Notify" name="notify">
                    <Input placeholder="Thông báo" />
                  </Form.Item>
                  <Form.Item label="NPC" name="npc_id">
                    <Select
                      showSearch
                      allowClear
                      optionFilterProp="label"
                      placeholder="Chọn NPC"
                      options={NPC_TEMPLATES.map(n => ({ value: n.id, label: `${n.name} (#${n.id})` }))}
                    />
                  </Form.Item>
                  <Form.Item label="Map" name="map" rules={[{ required: true, message: 'Chọn map' }]}>
                    <Select
                      showSearch
                      allowClear
                      optionFilterProp="label"
                      placeholder="Chọn map"
                      options={mapOptions}
                    />
                  </Form.Item>
                </Form>
              ) : (
                <div className="text-center py-10">
                  <Title level={4} style={{ marginBottom: 8 }}>Chọn một Sub Task ở cột bên trái</Title>
                  <Text type="secondary">Bạn có thể chỉnh sửa và lưu thay đổi tại đây</Text>
                </div>
              )}
              {/* Always attach the form instance to avoid AntD warning when not rendered */}
              <Form form={form} component={false} />
            </Card>
          </Col>

          {/* Right: Requirements & Rewards */}
          <Col xs={24} md={9}>
            <Card title={<Space><ApartmentOutlined /> <span>Điều kiện & Phần thưởng</span></Space>}>
              {selectedTaskId ? (
                <>
                  <RequirementsManager taskMainId={selectedTaskId} />
                  <div style={{ height: 12 }} />
                  <RewardsManager taskMainId={selectedTaskId} />
                </>
              ) : (
                <div className="text-center py-10">
                  <Title level={4} style={{ marginBottom: 8 }}>Chọn Task/Sub để xem chi tiết</Title>
                  <Text type="secondary">Chọn một Sub Task để lọc danh sách ở đây</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
