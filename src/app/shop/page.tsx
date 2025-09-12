"use client";

import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { Card, Button, Table, Input, Form, Space, message, Spin, Typography, Divider, Tooltip } from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import NpcCombobox from '@/components/NpcCombobox';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ShopListPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();
  const [isCreating, setIsCreating] = useState(false);

  const { data, mutate, isLoading } = useSWR(`/api/shops?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, fetcher);
  const { data: npcs, isLoading: npcsLoading } = useSWR('/api/npcs', fetcher);

  const onCreate = async (values: any) => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npc_id: Number(values.npcId),
          tag_name: values.tagName || undefined,
          type_shop: values.typeShop ? Number(values.typeShop) : undefined
        }),
      });

      if (res.ok) {
        message.success('Tạo shop thành công!');
        form.resetFields();
        mutate();
      } else {
        const errorData = await res.json();
        message.error(errorData.error || 'Có lỗi xảy ra khi tạo shop');
      }
    } catch {
      message.error('Có lỗi xảy ra khi tạo shop');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Typography.Title level={2} className="!mb-0">Quản lý Shop</Typography.Title>
          <Button type="primary" icon={<PlusOutlined />}>
            <Link href="/">Trang chủ</Link>
          </Button>
        </div>

        <Card
          title={
            <Space>
              <span>Thêm Shop</span>
              <Tooltip title="Tạo shop mới cho NPC để bán items">
                <InfoCircleOutlined className="text-gray-400" />
              </Tooltip>
            </Space>
          }
          extra={
            <Space>
              <Typography.Text type="secondary">Tạo shop mới cho NPC</Typography.Text>
              {npcsLoading && <Spin size="small" />}
            </Space>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onCreate}
            autoComplete="off"
            disabled={isCreating}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Form.Item
                name="npcId"
                label={
                  <Space>
                    <span>NPC</span>
                    <Typography.Text type="danger">*</Typography.Text>
                  </Space>
                }
                rules={[
                  { required: true, message: 'Vui lòng chọn NPC!' },
                  { validator: (_, value) => value ? Promise.resolve() : Promise.reject('NPC không hợp lệ') }
                ]}
                tooltip="Chọn NPC sẽ sở hữu shop này"
              >
                <NpcCombobox
                  placeholder="Tìm theo tên hoặc ID..."
                  items={npcs || []}
                  disabled={npcsLoading}
                />
              </Form.Item>

              <Form.Item
                name="tagName"
                label="Tag Name"
                tooltip="Tên tag để phân loại shop (tùy chọn)"
              >
                <Input
                  placeholder="VD: Weapon, Armor, Potion"
                  disabled={isCreating}
                />
              </Form.Item>

              <Form.Item
                name="typeShop"
                label="Type Shop"
                tooltip="Loại shop (số nguyên, tùy chọn)"
              >
                <Input
                  placeholder="VD: 1, 2, 3"
                  type="number"
                  disabled={isCreating}
                />
              </Form.Item>

              <Form.Item label=" " className="!mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusOutlined />}
                  loading={isCreating}
                  disabled={npcsLoading}
                  block
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo Shop'}
                </Button>
              </Form.Item>
            </div>

            <Divider className="!my-4" />

            <div className="bg-blue-50 p-3 rounded-lg">
              <Typography.Text type="secondary" className="text-sm">
                <InfoCircleOutlined className="mr-1" />
                <strong>Lưu ý:</strong> Sau khi tạo shop, bạn có thể thêm tabs và items vào shop để NPC có thể bán.
              </Typography.Text>
            </div>
          </Form>
        </Card>

        <Card
          title="Danh sách Shop"
          extra={
            <Space>
              <Typography.Text type="secondary">
                Tổng: {data?.total || 0} shops
              </Typography.Text>
              <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
                Làm mới
              </Button>
            </Space>
          }
        >
          <div className="mb-4">
            <Input.Search
              placeholder="Tìm theo tag hoặc NPC ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={() => mutate()}
              enterButton={<SearchOutlined />}
              allowClear
            />
          </div>

          <Spin spinning={isLoading}>
            <Table
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'id',
                  key: 'id',
                  width: 80,
                  sorter: (a: any, b: any) => a.id - b.id,
                },
                {
                  title: 'NPC',
                  dataIndex: 'npc_id',
                  key: 'npc_id',
                  render: (npcId: number) => (npcs || []).find((n: any) => n.id === npcId)?.NAME || `#${npcId}`,
                },
                {
                  title: 'Tag',
                  dataIndex: 'tag_name',
                  key: 'tag_name',
                  render: (tagName: string) => tagName || <Typography.Text type="secondary">-</Typography.Text>,
                },
                {
                  title: 'Type',
                  dataIndex: 'type_shop',
                  key: 'type_shop',
                  render: (typeShop: number) => typeShop ?? <Typography.Text type="secondary">-</Typography.Text>,
                },
                {
                  title: 'Tabs',
                  dataIndex: 'tab_count',
                  key: 'tab_count',
                  width: 80,
                  align: 'center',
                },
                {
                  title: 'Hành động',
                  key: 'actions',
                  width: 120,
                  render: (record: any) => (
                    <Button type="link" size="small">
                      <Link href={`/shop/${record.id}`}>Quản lý</Link>
                    </Button>
                  ),
                },
              ]}
              dataSource={data?.shops || []}
              rowKey="id"
              pagination={{
                current: page,
                total: data?.total || 0,
                pageSize: limit,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} shops`,
                onChange: (page) => setPage(page),
              }}
            />
          </Spin>
        </Card>
      </div>
    </div>
  );
}
