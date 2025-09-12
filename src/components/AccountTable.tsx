'use client';

import { Table } from 'antd';
import Link from 'next/link';

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
    ];

    const columns = type === 'account' ? accountColumns : playerColumns;

    return (
        <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            pagination={pagination}
        />
    );
}