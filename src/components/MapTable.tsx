'use client';

import { Table, Tag, Button } from 'antd';
import Link from 'next/link';

interface MapTableProps {
    dataSource: any[];
    pagination?: boolean;
    loading?: boolean;
}

export default function MapTable({ dataSource, pagination = false, loading = false }: MapTableProps) {
    const getPlanetName = (planetId: number) => {
        switch (planetId) {
            case 0: return 'Trái Đất';
            case 1: return 'Namek';
            case 2: return 'Xayda';
            default: return `Hành tinh ${planetId}`;
        }
    };

    const getPlanetColor = (planetId: number) => {
        switch (planetId) {
            case 0: return 'blue';
            case 1: return 'green';
            case 2: return 'orange';
            default: return 'default';
        }
    };

    const getMapTypeName = (type: number) => {
        switch (type) {
            case 0: return 'Thường';
            case 1: return 'PvP';
            case 2: return 'Boss';
            case 3: return 'Event';
            default: return `Loại ${type}`;
        }
    };

    const getMapTypeColor = (type: number) => {
        switch (type) {
            case 0: return 'default';
            case 1: return 'red';
            case 2: return 'purple';
            case 3: return 'gold';
            default: return 'default';
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            sorter: (a: any, b: any) => a.id - b.id,
        },
        {
            title: 'Tên Map',
            dataIndex: 'NAME',
            key: 'NAME',
            render: (name: string) => (
                <span className="font-medium">{name}</span>
            ),
            sorter: (a: any, b: any) => a.NAME.localeCompare(b.NAME),
        },
        {
            title: 'Hành Tinh',
            dataIndex: 'planet_id',
            key: 'planet_id',
            render: (planetId: number) => (
                <Tag color={getPlanetColor(planetId)}>
                    {getPlanetName(planetId)}
                </Tag>
            ),
            filters: [
                { text: 'Trái Đất', value: 0 },
                { text: 'Namek', value: 1 },
                { text: 'Xayda', value: 2 },
            ],
            onFilter: (value: any, record: any) => record.planet_id === value,
        },
        {
            title: 'Loại Map',
            dataIndex: 'type',
            key: 'type',
            render: (type: number) => (
                <Tag color={getMapTypeColor(type)}>
                    {getMapTypeName(type)}
                </Tag>
            ),
            filters: [
                { text: 'Thường', value: 0 },
                { text: 'PvP', value: 1 },
                { text: 'Boss', value: 2 },
                { text: 'Event', value: 3 },
            ],
            onFilter: (value: any, record: any) => record.type === value,
        },
        {
            title: 'Số Zone',
            dataIndex: 'zones',
            key: 'zones',
            width: 100,
            render: (zones: number) => (
                <span className="text-center">{zones}</span>
            ),
            sorter: (a: any, b: any) => a.zones - b.zones,
        },
        {
            title: 'Max Player',
            dataIndex: 'max_player',
            key: 'max_player',
            width: 120,
            render: (maxPlayer: number) => (
                <span className="text-center">{maxPlayer}</span>
            ),
            sorter: (a: any, b: any) => a.max_player - b.max_player,
        },
        {
            title: 'Hành Động',
            key: 'actions',
            width: 120,
            render: (record: any) => (
                <div className="flex space-x-2">
                    <Button size="small" type="primary">
                        <Link href={`/maps/${record.id}/edit`}>Sửa</Link>
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
            pagination={pagination ? {
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} map`,
            } : false}
            loading={loading}
            size="small"
        />
    );
}
