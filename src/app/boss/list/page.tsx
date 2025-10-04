import { prisma } from "@/lib/prisma";
import { getGenderName } from "@/lib/utils";
import { Card, Button, Input, Select, Tag } from "antd";

interface BossListPageProps {
    searchParams: {
        page?: string;
        search?: string;
        status?: string;
    };
}

export default async function BossListPage({ searchParams }: BossListPageProps) {
    const resolvedSearchParams = await searchParams;
    const page = parseInt(resolvedSearchParams.page || '1');
    const search = resolvedSearchParams.search || '';
    const status = resolvedSearchParams.status || 'all';
    const limit = 10;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
        where.name = {
            contains: search,
        };
    }

    if (status !== 'all') {
        where.is_active = status === 'active';
    }

    // Get bosses with pagination
    const [bosses, totalCount] = await Promise.all([
        prisma.bosses.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: {
                created_at: 'desc',
            },
            include: {
                boss_rewards: {
                    orderBy: { id: 'asc' },
                    include: { boss_reward_item_options: true },
                },
                boss_skills: {
                    take: 1,
                },
                boss_outfits: {
                    take: 1,
                },
            },
        }),
        prisma.bosses.count({ where }),
    ]);

    const itemIds = Array.from(new Set(bosses.flatMap(b => b.boss_rewards.map(r => r.item_id))));
    const itemNameById = new Map<number, string>();
    if (itemIds.length > 0) {
        const items = await prisma.item_template.findMany({
            where: { id: { in: itemIds } },
            select: { id: true, NAME: true },
        });
        for (const it of items) itemNameById.set(it.id, it.NAME);
    }

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Danh Sách Boss</h1>
                            <p className="mt-2 text-gray-600">Quản lý tất cả boss trong hệ thống</p>
                        </div>
                        <Button href="/boss/new" type="primary">Thêm Boss Mới</Button>
                    </div>
                </div>


                {/* Filters */}
                <Card className="mb-8" title="Bộ Lọc" extra={<span className="text-sm text-gray-500">Tìm kiếm và lọc boss theo điều kiện</span>}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tìm kiếm theo tên</label>
                            <Input
                                placeholder="Nhập tên boss..."
                                defaultValue={search}
                                allowClear
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Trạng thái</label>
                            <Select
                                defaultValue={status}
                                options={[
                                    { label: 'Tất cả', value: 'all' },
                                    { label: 'Hoạt động', value: 'active' },
                                    { label: 'Không hoạt động', value: 'inactive' },
                                ]}
                                style={{ width: '100%' }}
                                placeholder="Chọn trạng thái"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full" type="primary">Lọc</Button>
                        </div>
                    </div>
                </Card>


                {/* Boss Table */}
                <Card title="Danh sách Boss" extra={<span className="text-sm text-gray-500">Hiển thị {offset + 1} đến {Math.min(offset + limit, totalCount)} trong {totalCount} kết quả</span>}>
                    <div className="relative w-full overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="sticky top-0 z-10 bg-white">
                                <tr className="border-b">
                                    <th className="h-10 px-2 text-left align-middle font-medium">ID</th>
                                    <th className="h-10 px-2 text-left align-middle font-medium">Tên Boss</th>
                                    <th className="h-10 px-2 text-left align-middle font-medium">Hành Tinh</th>
                                    <th className="h-10 px-2 text-left align-middle font-medium">Sát Thương</th>
                                    <th className="h-10 px-2 text-left align-middle font-medium">Thời Gian Nghỉ</th>
                                    <th className="h-10 px-2 text-left align-middle font-medium">Trạng Thái</th>
                                    <th className="h-10 px-2 text-left align-middle font-medium">Ngày Tạo</th>
                                    <th className="h-10 px-2 text-left align-middle font-medium">Hành Động</th>
                                </tr>
                            </thead>
                            <tbody className="[&>tr:nth-child(even)]:bg-gray-50">
                                {bosses.map((boss) => (
                                    <tr key={boss.id} className="border-b hover:bg-gray-100 transition-colors">
                                        <td className="p-2 align-middle font-medium">{boss.id}</td>
                                        <td className="p-2 align-middle">
                                            <div>
                                                <div className="font-medium truncate max-w-[280px]">{boss.name}</div>
                                                {boss.boss_rewards.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {boss.boss_rewards.slice(0, 4).map((rw, idx) => (
                                                            <span key={`${boss.id}-rw-${idx}`} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 border border-gray-200">
                                                                {itemNameById.get(rw.item_id) || `Item #${rw.item_id}`} · SL {rw.quantity} · {rw.drop_rate.toFixed(1)}%
                                                            </span>
                                                        ))}
                                                        {boss.boss_rewards.length > 4 && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 border border-gray-200">+{boss.boss_rewards.length - 4} nữa</span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {boss.boss_rewards.length} phần thưởng, {boss.boss_skills.length} kỹ năng
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-2 align-middle">{getGenderName(boss.gender)}</td>
                                        <td className="p-2 align-middle">{boss.dame.toLocaleString()}</td>
                                        <td className="p-2 align-middle">{boss.seconds_rest ? `${boss.seconds_rest}s` : 'Không'}</td>
                                        <td className="p-2 align-middle">
                                            <Tag color={boss.is_active ? 'green' : 'default'}>
                                                {boss.is_active ? 'Hoạt Động' : 'Không Hoạt Động'}
                                            </Tag>
                                        </td>
                                        <td className="p-2 align-middle">{new Date(boss.created_at).toLocaleDateString('vi-VN')}</td>
                                        <td className="p-2 align-middle">
                                            <div className="flex space-x-2">
                                                <Button size="small" href={`/boss/${boss.id}/edit`}>Sửa</Button>
                                                <Button size="small" danger>Xóa</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Hiển thị {offset + 1} đến {Math.min(offset + limit, totalCount)} trong {totalCount} kết quả
                            </div>
                            <div className="flex space-x-2">
                                {page > 1 && (
                                    <Button size="small" href={`/boss/list?page=${page - 1}${search ? `&search=${search}` : ''}${status !== 'all' ? `&status=${status}` : ''}`}>
                                        Trước
                                    </Button>
                                )}

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNum = Math.max(1, page - 2) + i;
                                    if (pageNum > totalPages) return null;

                                    return (
                                        <Button key={pageNum} size="small" type={pageNum === page ? 'primary' : 'default'} href={`/boss/list?page=${pageNum}${search ? `&search=${search}` : ''}${status !== 'all' ? `&status=${status}` : ''}`}>
                                            {pageNum}
                                        </Button>
                                    );
                                })}

                                {page < totalPages && (
                                    <Button size="small" href={`/boss/list?page=${page + 1}${search ? `&search=${search}` : ''}${status !== 'all' ? `&status=${status}` : ''}`}>
                                        Sau
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}