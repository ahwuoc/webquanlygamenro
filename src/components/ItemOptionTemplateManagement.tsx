"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Typography, Row, Col, Tag, Button, Space, Table, Input, Drawer, Form, InputNumber, message, Popconfirm } from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { itemOptionTemplatesService, ItemOptionTemplate } from "@/lib/api/itemOptionTemplates.service";

export default function ItemOptionTemplateManagement() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ItemOptionTemplate[]>([]);
  // Không cần pagination states nữa
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ItemOptionTemplate | null>(null);
  const [form] = Form.useForm();

  // Bulk edit states
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditForm] = Form.useForm();

  const fetchData = useCallback(async (_search = search) => {
    try {
      setLoading(true);
      // Load tất cả dữ liệu không phân trang
      const response = await itemOptionTemplatesService.getAll();
      let filteredData = response;

      // Áp dụng filter search nếu có
      if (_search.trim()) {
        const searchLower = _search.trim().toLowerCase();
        filteredData = response.filter(item =>
          item.id.toString().includes(searchLower) ||
          item.NAME.toLowerCase().includes(searchLower)
        );
      }

      setData(filteredData);
      setTotal(filteredData.length);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Không thể tải danh sách item option templates");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = useCallback((record: ItemOptionTemplate) => {
    setIsEdit(true);
    setCurrentRecord(record);
    form.setFieldsValue({ id: record.id, NAME: record.NAME });
    setDrawerOpen(true);
  }, [form]);

  const onClose = () => setDrawerOpen(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && currentRecord) {
        await itemOptionTemplatesService.update(currentRecord.id, { NAME: values.NAME });
        message.success("Đã cập nhật item option template");
      } else {
        await itemOptionTemplatesService.create({ id: Number(values.id), NAME: values.NAME });
        message.success("Đã tạo item option template mới");
      }
      setDrawerOpen(false);
      await fetchData(search);
    } catch (e: any) {
      if (e?.errorFields) return; // antd validation
      console.error(e);
      message.error(e.message || "Thao tác thất bại");
    }
  };

  const handleDelete = useCallback(async (record: ItemOptionTemplate) => {
    try {
      await itemOptionTemplatesService.remove(record.id);
      message.success("Đã xóa item option template");
      await fetchData(search);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Xóa item option template thất bại");
    }
  }, [fetchData, search]);

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      setLoading(true);
      await Promise.all(selectedRowKeys.map((key) => itemOptionTemplatesService.remove(Number(key))));
      message.success(`Đã xóa ${selectedRowKeys.length} item option template`);
      setSelectedRowKeys([]);
      await fetchData(search);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || 'Xóa hàng loạt thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData(search);
  };

  const openBulkEdit = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một item để sửa hàng loạt");
      return;
    }
    setBulkEditOpen(true);
    bulkEditForm.resetFields();
  };

  const handleBulkEdit = async () => {
    try {
      const values = await bulkEditForm.validateFields();
      setLoading(true);
      
      // Cập nhật từng item được chọn
      const updatePromises = selectedRowKeys.map(async (key) => {
        const updates: any = {};
        
        // Chỉ cập nhật các field có giá trị
        if (values.namePrefix) {
          const currentItem = data.find(item => item.id === Number(key));
          if (currentItem) {
            updates.NAME = values.namePrefix + currentItem.NAME;
          }
        }
        
        if (values.nameSuffix) {
          const currentItem = data.find(item => item.id === Number(key));
          if (currentItem) {
            updates.NAME = (updates.NAME || currentItem.NAME) + values.nameSuffix;
          }
        }
        
        if (values.replaceText && values.newText !== undefined) {
          const currentItem = data.find(item => item.id === Number(key));
          if (currentItem) {
            const currentName = updates.NAME || currentItem.NAME;
            updates.NAME = currentName.replace(new RegExp(values.replaceText, 'g'), values.newText);
          }
        }
        
        if (values.newName) {
          updates.NAME = values.newName;
        }
        
        if (Object.keys(updates).length > 0) {
          return itemOptionTemplatesService.update(Number(key), updates);
        }
      });
      
      await Promise.all(updatePromises.filter(Boolean));
      message.success(`Đã cập nhật ${selectedRowKeys.length} item option template`);
      setBulkEditOpen(false);
      setSelectedRowKeys([]);
      await fetchData(search);
    } catch (e: any) {
      if (e?.errorFields) return; // antd validation
      console.error(e);
      message.error(e.message || "Cập nhật hàng loạt thất bại");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        width: 100,
        sorter: (a: ItemOptionTemplate, b: ItemOptionTemplate) => a.id - b.id,
        render: (id: number) => <Tag color="blue">#{id}</Tag>,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm theo ID"
              value={selectedKeys[0]}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                size="small"
                style={{ width: 90 }}
              >
                Tìm
              </Button>
              <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                Reset
              </Button>
            </Space>
          </div>
        ),
        filterIcon: (filtered: boolean) => (
          <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value: any, record: ItemOptionTemplate) =>
          record.id.toString().includes(value.toString()),
      },
      {
        title: "Tên Option",
        dataIndex: "NAME",
        sorter: (a: ItemOptionTemplate, b: ItemOptionTemplate) => a.NAME.localeCompare(b.NAME),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm theo tên"
              value={selectedKeys[0]}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                size="small"
                style={{ width: 90 }}
              >
                Tìm
              </Button>
              <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                Reset
              </Button>
            </Space>
          </div>
        ),
        filterIcon: (filtered: boolean) => (
          <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value: any, record: ItemOptionTemplate) =>
          record.NAME.toLowerCase().includes(value.toLowerCase()),
        render: (name: string, record: ItemOptionTemplate) => (
          <div>
            <Typography.Text strong style={{ color: "#1890ff", display: 'block' }}>
              {name}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {record.id}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: "Độ dài tên",
        dataIndex: "NAME",
        width: 120,
        sorter: (a: ItemOptionTemplate, b: ItemOptionTemplate) => a.NAME.length - b.NAME.length,
        render: (name: string) => (
          <Tag color={name.length > 20 ? "red" : name.length > 10 ? "orange" : "green"}>
            {name.length} ký tự
          </Tag>
        ),
      },
      {
        title: "Thông tin",
        key: "info",
        width: 150,
        render: (_: any, record: ItemOptionTemplate) => (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Tag color="purple" style={{ fontSize: '11px' }}>
                Template #{record.id}
              </Tag>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
              {record.NAME.length > 15 ? `${record.NAME.substring(0, 15)}...` : record.NAME}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: "Hành động",
        key: "action",
        width: 180,
        fixed: 'right' as const,
        render: (_: any, record: ItemOptionTemplate) => (
          <Space wrap>
            <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              Sửa
            </Button>
            <Popconfirm
              title="Xóa item option template"
              description={`Bạn có chắc muốn xóa Option #${record.id}?`}
              okText="Xóa"
              okType="danger"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record)}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>Xóa</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleDelete, openEdit]
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    preserveSelectedRowKeys: true,
  };

  return (
    <div className="space-y-6">
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Quản lý Item Option Templates
            </Typography.Title>
            <Typography.Text type="secondary">Quản lý các template option cho items trong game</Typography.Text>
          </Col>
          <Col xs={24} md={8}>
            <div className="text-right">
              <Space>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="🔍 Tìm theo ID hoặc tên"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onPressEnter={handleSearch}
                  style={{ width: 220 }}
                />
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  Tìm kiếm
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(search)}>
                  Tải lại
                </Button>
                <Button 
                  type="default" 
                  disabled={selectedRowKeys.length === 0}
                  onClick={openBulkEdit}
                >
                  Sửa đã chọn ({selectedRowKeys.length})
                </Button>
                <Popconfirm
                  title="Xóa các option templates đã chọn?"
                  okText="Xóa"
                  okType="danger"
                  cancelText="Hủy"
                  onConfirm={handleBulkDelete}
                  disabled={selectedRowKeys.length === 0}
                >
                  <Button danger disabled={selectedRowKeys.length === 0}>
                    Xóa đã chọn ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Thêm Option Template
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <div className="text-center">
              <Typography.Title level={3} style={{ margin: 0, color: "#1890ff" }}>
                {total}
              </Typography.Title>
              <Typography.Text type="secondary">Tổng Option Templates</Typography.Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div className="text-center">
              <Typography.Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                {selectedRowKeys.length}
              </Typography.Title>
              <Typography.Text type="secondary">Đã chọn</Typography.Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div className="text-center">
              <Typography.Title level={3} style={{ margin: 0, color: "#faad14" }}>
                {data.filter(item => item.NAME.length > 20).length}
              </Typography.Title>
              <Typography.Text type="secondary">Tên dài (&gt;20 ký tự)</Typography.Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div className="text-center">
              <Typography.Title level={3} style={{ margin: 0, color: "#722ed1" }}>
                {data.filter(item => item.NAME.length <= 10).length}
              </Typography.Title>
              <Typography.Text type="secondary">Tên ngắn (≤10 ký tự)</Typography.Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Danh sách Item Option Templates">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns as any}
          dataSource={data}
          size="middle"
          sticky
          rowSelection={rowSelection}
          pagination={false}
          scroll={{ x: 800, y: 700 }}
        />
      </Card>

      <Drawer
        title={isEdit ? `Chỉnh sửa Option Template #${currentRecord?.id}` : "Thêm Option Template Mới"}
        width={520}
        open={drawerOpen}
        onClose={onClose}
        destroyOnClose
        footer={
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit}>
              {isEdit ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </Space>
        }
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{ id: undefined, NAME: "" }}
        >
          {!isEdit && (
            <Form.Item
              name="id"
              label="ID"
              rules={[{ required: true, message: "Vui lòng nhập ID" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} placeholder="Nhập ID (số nguyên)" />
            </Form.Item>
          )}

          <Form.Item
            name="NAME"
            label="Tên Option Template"
            rules={[
              { required: true, message: "Vui lòng nhập tên option template" },
              { max: 255, message: "Tên không được vượt quá 255 ký tự" }
            ]}
            extra={`${form.getFieldValue('NAME')?.length || 0}/255 ký tự`}
          >
            <Input.TextArea
              placeholder="Nhập tên option template"
              rows={3}
              showCount
              maxLength={255}
            />
          </Form.Item>

          {isEdit && currentRecord && (
            <Card size="small" style={{ marginTop: 16, backgroundColor: '#f6f6f6' }}>
              <Typography.Text strong>Thông tin hiện tại:</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Typography.Text type="secondary">ID: </Typography.Text>
                <Tag color="blue">#{currentRecord.id}</Tag>
              </div>
              <div style={{ marginTop: 4 }}>
                <Typography.Text type="secondary">Độ dài tên: </Typography.Text>
                <Tag color={currentRecord.NAME.length > 20 ? "red" : currentRecord.NAME.length > 10 ? "orange" : "green"}>
                  {currentRecord.NAME.length} ký tự
                </Tag>
              </div>
            </Card>
          )}
        </Form>
      </Drawer>

      {/* Bulk Edit Drawer */}
      <Drawer
        title={`Sửa hàng loạt ${selectedRowKeys.length} Option Templates`}
        width={600}
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        destroyOnClose
        footer={
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setBulkEditOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleBulkEdit}>
              Cập nhật hàng loạt
            </Button>
          </Space>
        }
      >
        <Form
          layout="vertical"
          form={bulkEditForm}
          initialValues={{}}
        >
          <Card size="small" style={{ marginBottom: 16, backgroundColor: '#e6f7ff' }}>
            <Typography.Text strong>📝 Các tùy chọn sửa hàng loạt:</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary">
                • Thêm tiền tố/hậu tố vào tên hiện tại<br/>
                • Tìm và thay thế text trong tên<br/>
                • Đặt tên mới cho tất cả (ghi đè)
              </Typography.Text>
            </div>
          </Card>

          <Form.Item
            name="namePrefix"
            label="Thêm tiền tố vào đầu tên"
            extra="Ví dụ: 'New_' sẽ biến 'Option1' thành 'New_Option1'"
          >
            <Input placeholder="Nhập tiền tố (tùy chọn)" />
          </Form.Item>

          <Form.Item
            name="nameSuffix"
            label="Thêm hậu tố vào cuối tên"
            extra="Ví dụ: '_v2' sẽ biến 'Option1' thành 'Option1_v2'"
          >
            <Input placeholder="Nhập hậu tố (tùy chọn)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="replaceText"
                label="Tìm text"
                extra="Text cần thay thế trong tên"
              >
                <Input placeholder="Text cần tìm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="newText"
                label="Thay bằng"
                extra="Text mới thay thế"
              >
                <Input placeholder="Text thay thế" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="newName"
            label="Đặt tên mới cho tất cả"
            extra="⚠️ Cảnh báo: Sẽ ghi đè tên hiện tại của tất cả items đã chọn"
            rules={[
              { max: 255, message: "Tên không được vượt quá 255 ký tự" }
            ]}
          >
            <Input.TextArea 
              placeholder="Tên mới cho tất cả items (tùy chọn)" 
              rows={2}
              showCount
              maxLength={255}
            />
          </Form.Item>

          <Card size="small" style={{ backgroundColor: '#fff7e6' }}>
            <Typography.Text strong>🎯 Items sẽ được cập nhật:</Typography.Text>
            <div style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}>
              {selectedRowKeys.map(key => {
                const item = data.find(d => d.id === Number(key));
                return item ? (
                  <div key={key} style={{ marginBottom: 4 }}>
                    <Tag color="blue">#{item.id}</Tag>
                    <Typography.Text>{item.NAME}</Typography.Text>
                  </div>
                ) : null;
              })}
            </div>
          </Card>
        </Form>
      </Drawer>
    </div>
  );
}
