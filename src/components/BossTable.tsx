'use client';

import { Table, Tag, Button } from 'antd';
import Link from 'next/link';
import { getGenderName } from '@/lib/utils';

interface BossTableProps {
    dataSource: any[];
}

export default function BossTable({ dataSource }: BossTableProps) {
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Tên Boss',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Hành Tinh',
            dataIndex: 'gender',
            key: 'gender',
            render: (gender: number) => getGenderName(gender),
        },
        {
            title: 'Sát Thương',
            dataIndex: 'dame',
            key: 'dame',
            render: (dame: number) => dame.toLocaleString(),
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'default'}>
                    {isActive ? 'Hoạt Động' : 'Không Hoạt Động'}
                </Tag>
            ),
        },
        {
            title: 'Ngày Tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: Date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Hành Động',
            key: 'actions',
            render: (record: any) => (
                <div className="flex space-x-2">
                    <Button size="small" type="default">
                        <Link href={`/boss/${record.id}`}>Xem</Link>
                    </Button>
                    <Button size="small" type="default">
                        <Link href={`/boss/${record.id}/edit`}>Sửa</Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            pagination={false}
        />
    );
}
