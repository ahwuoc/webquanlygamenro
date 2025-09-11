import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getGenderName } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
                    take: 1,
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
                        <Button asChild>
                            <Link href="/boss/new">Thêm Boss Mới</Link>
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Bộ Lọc</CardTitle>
                        <CardDescription>Tìm kiếm và lọc boss theo điều kiện</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tìm kiếm theo tên</label>
                                <Input
                                    placeholder="Nhập tên boss..."
                                    defaultValue={search}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Trạng thái</label>
                                <Select defaultValue={status}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="active">Hoạt động</SelectItem>
                                        <SelectItem value="inactive">Không hoạt động</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button className="w-full">Lọc</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Boss Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách Boss</CardTitle>
                        <CardDescription>
                            Hiển thị {offset + 1} đến {Math.min(offset + limit, totalCount)} trong {totalCount} kết quả
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Tên Boss</TableHead>
                                    <TableHead>Hành Tinh</TableHead>
                                    <TableHead>Sát Thương</TableHead>
                                    <TableHead>Thời Gian Nghỉ</TableHead>
                                    <TableHead>Trạng Thái</TableHead>
                                    <TableHead>Ngày Tạo</TableHead>
                                    <TableHead>Hành Động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bosses.map((boss) => (
                                    <TableRow key={boss.id}>
                                        <TableCell className="font-medium">{boss.id}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{boss.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {boss.boss_rewards.length} phần thưởng, {boss.boss_skills.length} kỹ năng
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getGenderName(boss.gender)}</TableCell>
                                        <TableCell>{boss.dame.toLocaleString()}</TableCell>
                                        <TableCell>
                                            {boss.seconds_rest ? `${boss.seconds_rest}s` : 'Không'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={boss.is_active ? "default" : "secondary"}>
                                                {boss.is_active ? 'Hoạt Động' : 'Không Hoạt Động'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(boss.created_at).toLocaleDateString('vi-VN')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/boss/${boss.id}`}>Xem</Link>
                                                </Button>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/boss/${boss.id}/edit`}>Sửa</Link>
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                    Xóa
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Hiển thị {offset + 1} đến {Math.min(offset + limit, totalCount)} trong {totalCount} kết quả
                                </div>
                                <div className="flex space-x-2">
                                    {page > 1 && (
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/boss/list?page=${page - 1}${search ? `&search=${search}` : ''}${status !== 'all' ? `&status=${status}` : ''}`}>
                                                Trước
                                            </Link>
                                        </Button>
                                    )}

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = Math.max(1, page - 2) + i;
                                        if (pageNum > totalPages) return null;

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pageNum === page ? "default" : "outline"}
                                                size="sm"
                                                asChild
                                            >
                                                <Link href={`/boss/list?page=${pageNum}${search ? `&search=${search}` : ''}${status !== 'all' ? `&status=${status}` : ''}`}>
                                                    {pageNum}
                                                </Link>
                                            </Button>
                                        );
                                    })}

                                    {page < totalPages && (
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/boss/list?page=${page + 1}${search ? `&search=${search}` : ''}${status !== 'all' ? `&status=${status}` : ''}`}>
                                                Sau
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}