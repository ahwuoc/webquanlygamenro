"use client";

import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  Modal,
  Tabs
} from "antd";
import {
  PlayCircleOutlined,
  ReloadOutlined,
  SoundOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ClusterOutlined,
  ExclamationCircleOutlined,
  CodeOutlined,
  InfoCircleOutlined,
  PoweroffOutlined,
  RedoOutlined,
  FileTextOutlined,
  MonitorOutlined,
  DeleteOutlined,
  HeartOutlined
} from "@ant-design/icons";
import { adminService } from "@/lib/api/admin.service";
import AdminServerConfig from "./AdminServerConfig";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface CommandResult {
  success: boolean;
  message: string;
  error?: string;
  timestamp: Date;
}

export default function AdminCommandPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<CommandResult[]>([]);
  const [announcementForm] = Form.useForm();
  const [vipForm] = Form.useForm();
  const [customForm] = Form.useForm();

  const addResult = (result: Omit<CommandResult, 'timestamp'>) => {
    const newResult = { ...result, timestamp: new Date() };
    setResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const executeCommand = async (commandName: string, commandFn: () => Promise<any>) => {
    try {
      setLoading(commandName);
      const result = await commandFn();
      addResult(result);

      if (result.success) {
        // Check if it's a warning response
        if (result.error === 'Warning') {
          // Handle specific warning cases
          if (result.message.includes('already running')) {
            message.warning(`⚠️ ${commandName}: Server đã chạy rồi`);
          } else if (result.message.includes('is not running')) {
            message.warning(`⚠️ ${commandName}: Server đã tắt rồi`);
          } else if (result.message.includes('may still be running')) {
            message.warning(`⚠️ ${commandName}: Server có thể vẫn đang chạy, vui lòng kiểm tra thủ công`);
          } else {
            message.warning(`⚠️ ${commandName}: ${result.message}`);
          }
        } else {
          // Success cases
          if (result.message.includes('successfully')) {
            // Extract PID if available
            const pidMatch = result.message.match(/PID: (\d+)/);
            const pid = pidMatch ? ` (PID: ${pidMatch[1]})` : '';
            message.success(`✅ ${commandName}: Thành công${pid}`);
          } else if (result.message.includes('completed')) {
            message.success(`✅ ${commandName}: Hoàn thành`);
          } else {
            message.success(`✅ ${commandName}: ${result.message}`);
          }
        }
      } else {
        // Error cases
        if (result.message.includes('Error')) {
          message.error(`❌ ${commandName}: ${result.message}`);
        } else {
          message.error(`❌ ${commandName} failed: ${result.message}`);
        }
      }
    } catch (_error) {
      const errorMsg = _error instanceof Error ? _error.message : 'Unknown error';
      addResult({
        success: false,
        message: errorMsg,
        error: 'Exception'
      });
      message.error(`❌ ${commandName} error: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  };

  const handleAnnouncement = async (values: { message: string }) => {
    await executeCommand('Global Announcement', () =>
      adminService.sendAnnouncement(values.message)
    );
    announcementForm.resetFields();
  };

  const handleVipAnnouncement = async (values: { message: string }) => {
    await executeCommand('VIP Announcement', () =>
      adminService.sendVipAnnouncement(values.message)
    );
    vipForm.resetFields();
  };

  const handleMaintenance = async (values: { minutes?: number }) => {
    Modal.confirm({
      title: 'Xác nhận bảo trì server',
      content: `Server sẽ bảo trì trong ${values.minutes || 5} phút. Tất cả người chơi sẽ được thông báo.`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Bắt đầu bảo trì',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => executeCommand('Server Maintenance', () =>
        adminService.startMaintenance(values.minutes)
      ),
    });
  };

  const handleRestart = async (values: { minutes?: number }) => {
    Modal.confirm({
      title: 'Xác nhận restart server',
      content: `Server sẽ restart trong ${values.minutes || 5} phút. Tất cả người chơi sẽ được thông báo.`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Bắt đầu restart',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => executeCommand('Server Restart', () =>
        adminService.restartServer(values.minutes)
      ),
    });
  };

  const handleCustomCommand = async (values: { command: string; data?: string }) => {
    await executeCommand(`Custom: ${values.command}`, () =>
      adminService.sendCustomCommand(values.command, values.data)
    );
    customForm.resetFields();
  };

  // Game Server Management Handlers
  const handleStartGameServer = async () => {
    try {
      // Kiểm tra trạng thái server trước
      const statusResult = await adminService.getGameServerStatus();

      if (statusResult.success) {
        let statusData;
        try {
          statusData = JSON.parse(statusResult.message);
        } catch {
          // Nếu không parse được JSON, coi như server đã tắt
          statusData = { running: false };
        }

        if (statusData.running && statusData.pid > 0) {
          message.warning(`⚠️ Game server đã chạy rồi (PID: ${statusData.pid}). Không cần start.`);
          return;
        }
      }

      Modal.confirm({
        title: 'Khởi động Game Server',
        content: 'Bạn có chắc muốn khởi động game server?',
        icon: <PlayCircleOutlined />,
        okText: 'Khởi động',
        okType: 'primary',
        cancelText: 'Hủy',
        onOk: () => executeCommand('Start Game Server', () => adminService.startGameServer()),
      });
    } catch {
      Modal.confirm({
        title: 'Khởi động Game Server',
        content: 'Không thể kiểm tra trạng thái server. Bạn có chắc muốn khởi động game server?',
        icon: <PlayCircleOutlined />,
        okText: 'Khởi động',
        okType: 'primary',
        cancelText: 'Hủy',
        onOk: () => executeCommand('Start Game Server', () => adminService.startGameServer()),
      });
    }
  };

  const handleStopGameServer = async () => {
    try {
      // Kiểm tra trạng thái server trước
      const statusResult = await adminService.getGameServerStatus();

      if (statusResult.success) {
        let statusData;
        try {
          statusData = JSON.parse(statusResult.message);
        } catch {
          // Nếu không parse được JSON, coi như server đang chạy
          statusData = { running: true };
        }

        if (!statusData.running) {
          message.warning('⚠️ Game server đã tắt rồi (PID: -1). Không cần stop.');
          return;
        }
      }

      Modal.confirm({
        title: 'Dừng Game Server',
        content: 'Bạn có chắc muốn dừng game server? Tất cả người chơi sẽ bị ngắt kết nối.',
        icon: <ExclamationCircleOutlined />,
        okText: 'Dừng Server',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: () => executeCommand('Stop Game Server', () => adminService.stopGameServer()),
      });
    } catch {
      // Nếu không kiểm tra được status, vẫn cho phép stop
      Modal.confirm({
        title: 'Dừng Game Server',
        content: 'Không thể kiểm tra trạng thái server. Bạn có chắc muốn dừng game server?',
        icon: <ExclamationCircleOutlined />,
        okText: 'Dừng Server',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: () => executeCommand('Stop Game Server', () => adminService.stopGameServer()),
      });
    }
  };

  const handleRestartGameServer = async (values: { delaySeconds?: number }) => {
    Modal.confirm({
      title: 'Restart Game Server',
      content: `Game server sẽ restart sau ${values.delaySeconds || 10} giây. Tất cả người chơi sẽ được thông báo.`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Restart Server',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => executeCommand('Restart Game Server', () =>
        adminService.restartGameServer(values.delaySeconds)
      ),
    });
  };

  const handleForceKill = async () => {
    Modal.confirm({
      title: 'Force Kill Game Server',
      content: 'CẢNH BÁO: Force kill sẽ dừng game server ngay lập tức mà không lưu dữ liệu. Chỉ sử dụng khi server bị treo.',
      icon: <ExclamationCircleOutlined />,
      okText: 'Force Kill',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => executeCommand('Force Kill Game Server', () => adminService.forceKillGameServer()),
    });
  };

  const isLoading = (command: string) => loading === command;

  const tabItems = [
    {
      key: 'status',
      label: <span><InfoCircleOutlined />Server Status</span>,
      children: (
        <Card title="Thông tin Server" size="small">
          <Space wrap>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={isLoading('Server Status')}
              onClick={() => executeCommand('Server Status', () => adminService.getStatus())}
            >
              Server Status
            </Button>
            <Button
              icon={<PlayCircleOutlined />}
              loading={isLoading('Player Count')}
              onClick={() => executeCommand('Player Count', () => adminService.getPlayerCount())}
            >
              Player Count
            </Button>
            <Button
              icon={<PlayCircleOutlined />}
              loading={isLoading('Thread Count')}
              onClick={() => executeCommand('Thread Count', () => adminService.getThreadCount())}
            >
              Thread Count
            </Button>
            <Button
              icon={<PlayCircleOutlined />}
              loading={isLoading('GameLoop Stats')}
              onClick={() => executeCommand('GameLoop Stats', () => adminService.getGameLoopStats())}
            >
              GameLoop Stats
            </Button>
          </Space>
        </Card>
      )
    },
    {
      key: 'gameserver',
      label: <span><MonitorOutlined />Game Server</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card title="Server Control" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  loading={isLoading('Start Game Server')}
                  onClick={handleStartGameServer}
                  block
                >
                  Start Game Server
                </Button>
                <Button
                  danger
                  icon={<PoweroffOutlined />}
                  loading={isLoading('Stop Game Server')}
                  onClick={handleStopGameServer}
                  block
                >
                  Stop Game Server
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Server Restart" size="small">
              <Form onFinish={handleRestartGameServer} layout="vertical">
                <Form.Item name="delaySeconds" label="Delay (giây)">
                  <InputNumber
                    min={5}
                    max={300}
                    placeholder="10 (mặc định)"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    danger
                    htmlType="submit"
                    icon={<RedoOutlined />}
                    loading={isLoading('Restart Game Server')}
                    block
                  >
                    Restart Game Server
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Monitoring & Emergency" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<HeartOutlined />}
                  loading={isLoading('Health Check')}
                  onClick={() => executeCommand('Health Check', () => adminService.healthCheck())}
                  block
                >
                  Health Check
                </Button>
                <Button
                  icon={<InfoCircleOutlined />}
                  loading={isLoading('Game Server Status')}
                  onClick={() => executeCommand('Game Server Status', () => adminService.getGameServerStatus())}
                  block
                >
                  Game Server Status
                </Button>
                <Button
                  icon={<FileTextOutlined />}
                  loading={isLoading('Game Server Logs')}
                  onClick={() => executeCommand('Game Server Logs', () => adminService.getGameServerLogs(100))}
                  block
                >
                  View Logs (100 lines)
                </Button>
                <Button
                  icon={<MonitorOutlined />}
                  loading={isLoading('Admin Server Status')}
                  onClick={() => executeCommand('Admin Server Status', () => adminService.getAdminServerStatus())}
                  block
                >
                  Admin Server Status
                </Button>
                <Divider style={{ margin: '8px 0' }} />
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={isLoading('Force Kill Game Server')}
                  onClick={handleForceKill}
                  block
                >
                  Force Kill (Emergency)
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'data',
      label: <span><DatabaseOutlined />Data Management</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Lưu dữ liệu" size="small">
              <Button
                type="primary"
                icon={<DatabaseOutlined />}
                loading={isLoading('Save Clan Data')}
                onClick={() => executeCommand('Save Clan Data', () => adminService.saveClanData())}
                block
              >
                Save Clan Data
              </Button>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Cache Management" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  icon={<ReloadOutlined />}
                  loading={isLoading('Refresh Mob Cache')}
                  onClick={() => executeCommand('Refresh Mob Cache', () => adminService.refreshMobCache())}
                  block
                >
                  Refresh Mob Cache
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  loading={isLoading('Refresh Boss Cache')}
                  onClick={() => executeCommand('Refresh Boss Cache', () => adminService.refreshBossCache())}
                  block
                >
                  Refresh Boss Cache
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  loading={isLoading('Refresh Gift Cache')}
                  onClick={() => executeCommand('Refresh Gift Cache', () => adminService.refreshGiftCache())}
                  block
                >
                  Refresh Gift Cache
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'announcements',
      label: <span><SoundOutlined />Announcements</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Global Announcement" size="small">
              <Form form={announcementForm} onFinish={handleAnnouncement} layout="vertical">
                <Form.Item
                  name="message"
                  rules={[{ required: true, message: 'Nhập nội dung thông báo' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="Nhập nội dung thông báo cho tất cả người chơi..."
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SoundOutlined />}
                    loading={isLoading('Global Announcement')}
                    block
                  >
                    Gửi thông báo toàn server
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="VIP Announcement" size="small">
              <Form form={vipForm} onFinish={handleVipAnnouncement} layout="vertical">
                <Form.Item
                  name="message"
                  rules={[{ required: true, message: 'Nhập nội dung thông báo VIP' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="Nhập nội dung thông báo cho VIP..."
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SoundOutlined />}
                    loading={isLoading('VIP Announcement')}
                    block
                  >
                    Gửi thông báo VIP
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'management',
      label: <span><SettingOutlined />Server Management</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Server Maintenance" size="small">
              <Alert
                message="Cảnh báo"
                description="Bảo trì sẽ thông báo cho players, lưu dữ liệu và tạm dừng server."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form onFinish={handleMaintenance} layout="vertical">
                <Form.Item name="minutes" label="Thời gian bảo trì (phút)">
                  <InputNumber
                    min={1}
                    max={60}
                    placeholder="5 (mặc định)"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    danger
                    htmlType="submit"
                    icon={<SettingOutlined />}
                    loading={isLoading('Server Maintenance')}
                    block
                  >
                    Bắt đầu bảo trì
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Server Restart" size="small">
              <Alert
                message="Nguy hiểm"
                description="Restart sẽ lưu dữ liệu và khởi động lại server hoàn toàn."
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form onFinish={handleRestart} layout="vertical">
                <Form.Item name="minutes" label="Thời gian chờ trước khi restart (phút)">
                  <InputNumber
                    min={1}
                    max={60}
                    placeholder="5 (mặc định)"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    danger
                    htmlType="submit"
                    icon={<ReloadOutlined />}
                    loading={isLoading('Server Restart')}
                    block
                  >
                    Restart Server
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'config',
      label: <span><SettingOutlined />Server Config</span>,
      children: <AdminServerConfig />
    },
    {
      key: 'custom',
      label: <span><CodeOutlined />Custom Commands</span>,
      children: (
        <Card title="Custom Command" size="small">
          <Alert
            message="Dành cho người dùng nâng cao"
            description="Gửi command tùy chỉnh đến admin server. Hãy cẩn thận khi sử dụng."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={customForm} onFinish={handleCustomCommand} layout="vertical">
            <Form.Item
              name="command"
              label="Command"
              rules={[{ required: true, message: 'Nhập command' }]}
            >
              <Input placeholder="Ví dụ: status, players, threads..." />
            </Form.Item>
            <Form.Item name="data" label="Data (tùy chọn)">
              <Input placeholder="Dữ liệu bổ sung cho command..." />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CodeOutlined />}
                loading={loading === 'Custom Command'}
                block
              >
                Gửi Command
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <ClusterOutlined /> Admin Command Panel
      </Title>
      <Paragraph type="secondary">
        Gửi commands đến Standalone Admin Server (36.50.135.62:9090/admin) để quản lý game server độc lập.
      </Paragraph>

      <Tabs defaultActiveKey="status" type="card" items={tabItems} />

      {/* Command Results */}
      {results.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Command Results</Title>
          <Card size="small">
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {results.map((result, index) => (
                <div key={index} style={{
                  padding: '8px',
                  borderBottom: index < results.length - 1 ? '1px solid #f0f0f0' : 'none',
                  fontSize: '12px'
                }}>
                  <div style={{
                    color: result.success ? '#52c41a' : '#ff4d4f',
                    fontWeight: 'bold'
                  }}>
                    {result.success ? '✅' : '❌'} {result.timestamp.toLocaleTimeString()}
                  </div>
                  <div style={{ marginTop: '4px', fontFamily: 'monospace' }}>
                    {result.message}
                  </div>
                  {result.error && (
                    <div style={{ color: '#ff7875', fontSize: '11px' }}>
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
