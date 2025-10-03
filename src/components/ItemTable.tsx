'use client';

import { Table, Tag, Tooltip, Button } from 'antd';
import { getGenderName } from '@/lib/utils';

export interface ItemRow {
  id: number;
  NAME: string;
  TYPE: number;
  part: number;
  gender: number;
  description: string;
}

interface ItemTableProps {
  dataSource: ItemRow[];
  loading?: boolean;
  pagination?: false | { current: number; pageSize: number; total: number; onChange: (page: number, pageSize: number) => void };
  onEdit?: (row: ItemRow) => void;
}

export default function ItemTable({ dataSource, loading = false, pagination = false, onEdit }: ItemTableProps) {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      sorter: (a: ItemRow, b: ItemRow) => a.id - b.id,
    },
    {
      title: 'Tên Item',
      dataIndex: 'NAME',
      key: 'NAME',
      sorter: (a: ItemRow, b: ItemRow) => a.NAME.localeCompare(b.NAME),
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: 'TYPE',
      dataIndex: 'TYPE',
      key: 'TYPE',
      width: 90,
      sorter: (a: ItemRow, b: ItemRow) => a.TYPE - b.TYPE,
      render: (t: number) => <Tag color="geekblue">{t}</Tag>,
    },
    {
      title: 'Part',
      dataIndex: 'part',
      key: 'part',
      width: 90,
      sorter: (a: ItemRow, b: ItemRow) => a.part - b.part,
      render: (p: number) => <Tag>{p}</Tag>,
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 140,
      sorter: (a: ItemRow, b: ItemRow) => a.gender - b.gender,
      render: (g: number) => (
        <Tag color={g === 0 ? 'blue' : g === 1 ? 'green' : g === 2 ? 'orange' : 'default'}>
          {getGenderName(g)}
        </Tag>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => (
        <Tooltip title={desc}>
          <span className="text-gray-600">{desc}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 130,
      render: (_: any, record: ItemRow) => (
        <Button size="small" type="primary" onClick={() => onEdit?.(record)}>Chỉnh sửa</Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      loading={loading}
      pagination={pagination || false}
      size="small"
    />
  );
}
