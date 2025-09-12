import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, Button } from "antd";
import BossTable from "@/components/BossTable";

export default async function BossDashboard() {
    // Lấy thống kê boss
    const bossStats = await prisma.bosses.aggregate({
        _count: {
            id: true,
        },
    });

    const activeBosses = await prisma.bosses.count({
        where: {
            is_active: true,
        },
    });

    // Lấy danh sách boss gần đây
    const recentBosses = await prisma.bosses.findMany({
        take: 5,
        orderBy: {
            created_at: 'desc',
        },
        include: {
            boss_rewards: {
                take: 3,
            },
            boss_skills: {
                take: 3,
            },
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Boss Management</h1>
                            <p className="mt-2 text-gray-600">Quản lý hệ thống boss trong game</p>
                        </div>
                        <Button type="primary">
                            <Link href="/boss/new">
                                Thêm Boss Mới
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card
                        title="Tổng Boss"
                        extra={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        }
                    >
                        <div className="text-2xl font-bold">{bossStats._count.id}</div>
                        <p className="text-xs text-muted-foreground">
                            Tổng số boss trong hệ thống
                        </p>
                    </Card>

                    <Card
                        title="Boss Hoạt Động"
                        extra={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    >
                        <div className="text-2xl font-bold text-green-600">{activeBosses}</div>
                        <p className="text-xs text-muted-foreground">
                            Boss đang hoạt động
                        </p>
                    </Card>

                    <Card
                        title="Boss Không Hoạt Động"
                        extra={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    >
                        <div className="text-2xl font-bold text-red-600">{bossStats._count.id - activeBosses}</div>
                        <p className="text-xs text-muted-foreground">
                            Boss không hoạt động
                        </p>
                    </Card>
                </div>

                {/* Recent Bosses */}
                <Card
                    title="Boss Gần Đây"
                    extra="Danh sách 5 boss được tạo gần đây nhất"
                >
                    <BossTable dataSource={recentBosses} />
                </Card>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        title={
                            <div className="flex items-center space-x-2">
                                <div className="p-2 rounded-full bg-blue-100">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <span className="text-lg">Danh Sách Boss</span>
                            </div>
                        }
                    >
                        <Link href="/boss/list">
                            <div>Xem tất cả boss trong hệ thống</div>
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    );
}