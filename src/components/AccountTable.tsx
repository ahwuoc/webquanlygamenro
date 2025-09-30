'use client';

import { Table, Button, Modal, Form, Input, InputNumber, Popconfirm, message } from 'antd';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation';

interface AccountTableProps {
    dataSource: any[];
    pagination?: any;
    type: 'account' | 'player';
    baseParams: any;
}

// Utility function to build query string
function buildQuery(base: Record<string, string | number | undefined>, overrides: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | number | undefined> = { ...base, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") params.set(k, String(v));
    });
    return `?${params.toString()}`;
}

export default function AccountTable({ dataSource, pagination, type, baseParams }: AccountTableProps) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);

    const handleEdit = (record: any) => {
        setEditing(record);
        form.setFieldsValue({
            name: record.name,
            gender: record.gender,
            head: record.head,
            thoi_vang: record.thoi_vang,
            account_id: record.account_id ?? null,
        });
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            message.success('Đã xóa player');
            router.refresh();
        } catch (e) {
            console.error(e);
            message.error('Xóa player thất bại');
        }
    };

    const onSubmit = async () => {
        try {
            const values = await form.validateFields();
            const res = await fetch(`/api/players/${editing.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: values.name,
                    gender: typeof values.gender === 'number' ? values.gender : parseInt(values.gender, 10),
                    head: values.head,
                    thoi_vang: values.thoi_vang,
                    account_id: values.account_id === null || values.account_id === '' ? null : Number(values.account_id),
                }),
            });
            if (!res.ok) throw new Error('Update failed');
            message.success('Đã cập nhật player');
            setOpen(false);
            setEditing(null);
            router.refresh();
        } catch (e) {
            console.error(e);
            message.error('Cập nhật player thất bại');
        }
    };

    const accountColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            render: (username: string, record: any) => (
                <Link
                    href={`/account${buildQuery({ ...baseParams, pageP: 1 }, { accountId: record.id })}#players`}
                    className="text-blue-600 hover:underline"
                    title="Lọc player theo account này"
                >
                    {username}
                </Link>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
        },
        {
            title: 'Admin',
            dataIndex: 'is_admin',
            key: 'is_admin',
            render: (isAdmin: boolean) => isAdmin ? 'Yes' : 'No',
        },
        {
            title: 'Active',
            dataIndex: 'active',
            key: 'active',
            render: (active: boolean) => active ? 'Active' : 'Inactive',
        },
        {
            title: 'Last Login',
            dataIndex: 'last_time_login',
            key: 'last_time_login',
            render: (date: Date) => {
                if (!date) return '-';
                return new Date(date).toISOString().replace('T', ' ').substring(0, 19);
            },
        },
        {
            title: 'Last Logout',
            dataIndex: 'last_time_logout',
            key: 'last_time_logout',
            render: (date: Date) => {
                if (!date) return '-';
                return new Date(date).toISOString().replace('T', ' ').substring(0, 19);
            },
        },
    ];

    const playerColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Account ID',
            dataIndex: 'account_id',
            key: 'account_id',
            render: (accountId: number) => accountId ?? '-',
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <span className="font-medium">{name}</span>,
        },
        {
            title: 'Hành Tinh',
            dataIndex: 'gender',
            key: 'gender',
        },
        {
            title: 'Head',
            dataIndex: 'head',
            key: 'head',
        },
        {
            title: 'Thỏi vàng',
            dataIndex: 'thoi_vang',
            key: 'thoi_vang',
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    <Button size="small" onClick={() => handleEdit(record)}>Sửa</Button>
                    <Popconfirm
                        title="Xóa player"
                        description={`Bạn có chắc muốn xóa player #${record.id}?`}
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button size="small" danger>Xóa</Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    const columns = type === 'account' ? accountColumns : playerColumns;

    return (
        <>
            <Table
                columns={columns}
                dataSource={dataSource}
                rowKey="id"
                pagination={pagination}
            />

            <Modal
                open={open}
                title={editing ? `Sửa Player #${editing.id}` : 'Sửa Player'}
                onCancel={() => { setOpen(false); setEditing(null); }}
                onOk={onSubmit}
                okText="Lưu"
                cancelText="Hủy"
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item label="Tên" name="name" rules={[{ required: true, message: 'Nhập tên' }]}> 
                        <Input maxLength={20} />
                    </Form.Item>
                    <Form.Item label="Hành Tinh (gender)" name="gender" rules={[{ required: true, message: 'Nhập gender' }]}> 
                        <InputNumber min={0} max={3} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Head" name="head" rules={[{ required: true, message: 'Nhập head' }]}> 
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Thỏi vàng" name="thoi_vang" rules={[{ required: true, message: 'Nhập thỏi vàng' }]}> 
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Account ID (có thể để trống)" name="account_id"> 
                        <Input placeholder="vd: 123 hoặc để trống" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}