import { prisma } from "@/lib/prisma";
import { Card } from "antd";
import MapTable from "@/components/MapTable";

export default async function MapsDashboard() {
    // Lấy thống kê map
    const mapStats = await prisma.map_template.aggregate({
        _count: {
            id: true,
        },
    });

    // Lấy thống kê theo hành tinh
    const planetStats = await prisma.map_template.groupBy({
        by: ['planet_id'],
        _count: {
            id: true,
        },
    });

    // Lấy toàn bộ danh sách map (theo ID để có thứ tự)
    const maps = await prisma.map_template.findMany({
        orderBy: {
            id: 'desc',
        },
    });

    // Tính tổng số map theo từng hành tinh
    const earthMaps = planetStats.find(p => p.planet_id === 0)?._count.id || 0;
    const namekMaps = planetStats.find(p => p.planet_id === 1)?._count.id || 0;
    const xaydaMaps = planetStats.find(p => p.planet_id === 2)?._count.id || 0;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Map Management</h1>
                            <p className="mt-2 text-gray-600">Quản lý hệ thống map trong game</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card
                        title="Tổng Map"
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
                        <div className="text-2xl font-bold">{mapStats._count.id}</div>
                        <p className="text-xs text-muted-foreground">
                            Tổng số map trong hệ thống
                        </p>
                    </Card>

                    <Card
                        title="Trái Đất"
                        extra={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-blue-600"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                            </svg>
                        }
                    >
                        <div className="text-2xl font-bold text-blue-600">{earthMaps}</div>
                        <p className="text-xs text-muted-foreground">
                            Map trên Trái Đất
                        </p>
                    </Card>

                    <Card
                        title="Namek"
                        extra={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-green-600"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                            </svg>
                        }
                    >
                        <div className="text-2xl font-bold text-green-600">{namekMaps}</div>
                        <p className="text-xs text-muted-foreground">
                            Map trên Namek
                        </p>
                    </Card>

                    <Card
                        title="Xayda"
                        extra={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-orange-600"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                            </svg>
                        }
                    >
                        <div className="text-2xl font-bold text-orange-600">{xaydaMaps}</div>
                        <p className="text-xs text-muted-foreground">
                            Map trên Xayda
                        </p>
                    </Card>
                </div>

                {/* Danh sách Map */}
                <Card
                    title="Danh Sách Map"
                    extra={`Tổng: ${mapStats._count.id} map`}
                >
                    <MapTable dataSource={maps} pagination />
                </Card>

                {/* Quick Actions removed: list page deprecated */}
            </div>
        </div>
    );
}
