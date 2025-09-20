import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, Button, Tag, Descriptions } from "antd";
import { notFound } from "next/navigation";

interface MapDetailPageProps {
    params: {
        id: string;
    };
}

export default async function MapDetailPage({ params }: MapDetailPageProps) {
    const { id } = await params;
    const mapId = parseInt(id);

    if (isNaN(mapId)) {
        notFound();
    }

    const map = await prisma.map_template.findUnique({
        where: {
            id: mapId,
        },
    });

    if (!map) {
        notFound();
    }

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

    const getBgTypeName = (bgType: number) => {
        switch (bgType) {
            case 0: return 'Ngày';
            case 1: return 'Đêm';
            case 2: return 'Hoàng hôn';
            case 3: return 'Bình minh';
            default: return `Loại ${bgType}`;
        }
    };

    // Parse JSON data
    let data = null;
    let waypoints = null;
    let mobs = null;
    let npcs = null;

    try {
        data = JSON.parse(map.data);
    } catch (e) {
        console.error('Error parsing data JSON:', e);
    }

    try {
        waypoints = JSON.parse(map.waypoints);
    } catch (e) {
        console.error('Error parsing waypoints JSON:', e);
    }

    try {
        mobs = JSON.parse(map.mobs);
    } catch (e) {
        console.error('Error parsing mobs JSON:', e);
    }

    try {
        npcs = JSON.parse(map.npcs);
    } catch (e) {
        console.error('Error parsing npcs JSON:', e);
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{map.NAME}</h1>
                            <p className="mt-2 text-gray-600">Chi tiết thông tin map</p>
                        </div>
                        <div className="flex space-x-3">
                            <Button>
                                <Link href="/maps">
                                    Quay Lại Dashboard
                                </Link>
                            </Button>
                            <Button>
                                <Link href="/maps/list">
                                    Danh Sách Map
                                </Link>
                            </Button>
                            <Button type="primary">
                                <Link href={`/maps/${map.id}/edit`}>
                                    Chỉnh Sửa
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Basic Information */}
                    <div className="lg:col-span-2">
                        <Card title="Thông Tin Cơ Bản" className="mb-6">
                            <Descriptions column={2} bordered>
                                <Descriptions.Item label="ID Map" span={1}>
                                    <span className="font-mono">{map.id}</span>
                                </Descriptions.Item>
                                <Descriptions.Item label="Tên Map" span={1}>
                                    <span className="font-medium">{map.NAME}</span>
                                </Descriptions.Item>
                                <Descriptions.Item label="Hành Tinh" span={1}>
                                    <Tag color={getPlanetColor(map.planet_id)}>
                                        {getPlanetName(map.planet_id)}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Loại Map" span={1}>
                                    <Tag color={getMapTypeColor(map.type)}>
                                        {getMapTypeName(map.type)}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Số Zone" span={1}>
                                    {map.zones}
                                </Descriptions.Item>
                                <Descriptions.Item label="Max Player" span={1}>
                                    {map.max_player}
                                </Descriptions.Item>
                                <Descriptions.Item label="Background Type" span={1}>
                                    {getBgTypeName(map.bg_type)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Tile ID" span={1}>
                                    {map.tile_id}
                                </Descriptions.Item>
                                <Descriptions.Item label="Background ID" span={1}>
                                    {map.bg_id}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* Map Data */}
                        <Card title="Dữ Liệu Map" className="mb-6">
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <pre className="text-sm overflow-auto max-h-64">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            </div>
                        </Card>

                        {/* Waypoints */}
                        <Card title="Waypoints" className="mb-6">
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <pre className="text-sm overflow-auto max-h-64">
                                    {JSON.stringify(waypoints, null, 2)}
                                </pre>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Mobs */}
                        <Card title="Mobs" className="mb-6">
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <pre className="text-sm overflow-auto max-h-64">
                                    {JSON.stringify(mobs, null, 2)}
                                </pre>
                            </div>
                        </Card>

                        {/* NPCs */}
                        <Card title="NPCs" className="mb-6">
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <pre className="text-sm overflow-auto max-h-64">
                                    {JSON.stringify(npcs, null, 2)}
                                </pre>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card title="Hành Động Nhanh">
                            <div className="space-y-3">
                                <Button block type="primary">
                                    <Link href={`/maps/${map.id}/edit`}>
                                        Chỉnh Sửa Map
                                    </Link>
                                </Button>
                                <Button block>
                                    <Link href="/maps/list">
                                        Xem Tất Cả Map
                                    </Link>
                                </Button>
                                <Button block>
                                    <Link href="/maps">
                                        Quay Lại Dashboard
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
