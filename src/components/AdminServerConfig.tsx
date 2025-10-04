"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, message, Typography, Space, Alert } from "antd";
import { SettingOutlined, SaveOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface ServerConfig {
  baseUrl: string;
}

export default function AdminServerConfig() {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<ServerConfig>({ 
    baseUrl: process.env.NEXT_PUBLIC_ADMIN_SERVER_URL || 'http://36.50.135.62:9090/admin' 
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('admin-server-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        form.setFieldsValue(parsed);
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  }, [form]);

  const handleSave = async (values: ServerConfig) => {
    try {
      // Save to localStorage
      localStorage.setItem('admin-server-config', JSON.stringify(values));
      setConfig(values);

      // Update the admin service baseUrl
      if (typeof window !== 'undefined') {
        (window as any).adminServerBaseUrl = values.baseUrl;
      }

      message.success('Đã lưu cấu hình server admin');
    } catch {
      message.error('Lỗi khi lưu cấu hình');
    }
  };

  const resetToDefault = () => {
    const defaultConfig = { baseUrl: 'http://36.50.135.62:9090/admin' };
    form.setFieldsValue(defaultConfig);
    setConfig(defaultConfig);
    localStorage.removeItem('admin-server-config');
    message.info('Đã reset về cấu hình mặc định');
  };

  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          <span>Cấu hình Server Admin</span>
        </Space>
      }
      size="small"
    >
      <Alert
        message="Thông tin"
        description="Thay đổi URL của Standalone Admin Server nếu server chạy trên VPS hoặc port khác. Mặc định: 36.50.135.62:9090/admin"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        onFinish={handleSave}
        layout="vertical"
        initialValues={config}
      >
        <Form.Item
          name="baseUrl"
          label="Admin Server URL"
          rules={[
            { required: true, message: 'Nhập URL admin server' },
            { type: 'url', message: 'URL không hợp lệ' }
          ]}
        >
          <Input
            placeholder="http://36.50.135.62:9090/admin"
            addonBefore="URL:"
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
            >
              Lưu cấu hình
            </Button>
            <Button onClick={resetToDefault}>
              Reset mặc định
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
        <Text strong>URL hiện tại: </Text>
        <Text code>{config.baseUrl}</Text>
      </div>
    </Card>
  );
}
