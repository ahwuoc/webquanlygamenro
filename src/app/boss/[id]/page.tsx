import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGenderName } from "@/lib/utils";
import { Card, Tag, Button } from "antd";

interface BossDetailPageProps {
    params: {
        id: string;
    };
}

export default async function BossDetailPage({ params }: BossDetailPageProps) {
    const resolvedParams = await params;
    const bossId = parseInt(resolvedParams.id);

    // Validate bossId
    if (isNaN(bossId) || bossId <= 0) {
        notFound();
    }

    const boss = await prisma.bosses.findUnique({
        where: {
            id: bossId,
        },
        include: {
            boss_rewards: true,
            boss_skills: true,
            boss_outfits: true,
            boss_texts: true,
        },
    });

    if (!boss) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{boss.name}</h1>
                            <p className="mt-2 text-gray-600">Chi tiết boss #{boss.id}</p>
                        </div>
                        <div className="flex space-x-3">
                            <Button type="primary">
                                <Link href={`/boss/${boss.id}/edit`}>Chỉnh Sửa</Link>
                            </Button>
                            <Button type="default">
                                <Link href="/boss">Quay Lại</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <Card
                            title="Thông Tin Cơ Bản"
                            extra="Thông tin chi tiết về boss"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID</label>
                                    <p className="mt-1 text-sm text-gray-900">{boss.id}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tên Boss</label>
                                    <p className="mt-1 text-sm text-gray-900">{boss.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Hành Tinh</label>
                                    <p className="mt-1 text-sm text-gray-900">{getGenderName(boss.gender)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sát Thương</label>
                                    <p className="mt-1 text-sm text-gray-900">{boss.dame.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Thời Gian Nghỉ</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {boss.seconds_rest ? `${boss.seconds_rest} giây` : 'Không có'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Loại Xuất Hiện</label>
                                    <p className="mt-1 text-sm text-gray-900">{boss.type_appear || 'Không xác định'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Trạng Thái</label>
                                    <Tag color={boss.is_active ? 'green' : 'default'}>
                                        {boss.is_active ? 'Hoạt Động' : 'Không Hoạt Động'}
                                    </Tag>
                                </div>
                            </div>
                        </Card>

                        {/* HP JSON */}
                        <Card
                            title="Thông Tin HP"
                            extra="Cấu hình HP theo level"
                        >
                            {(() => {
                                try {
                                    const hpData = JSON.parse(boss.hp_json);
                                    if (Array.isArray(hpData)) {
                                        // Format: [2000000000000] - Array of HP values
                                        return (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">Số lượng level HP:</span>
                                                    <Tag color="green">{hpData.length}</Tag>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {hpData.map((hp: number, index: number) => (
                                                        <div key={index} className="relative p-3 bg-red-50 border border-red-200 rounded-lg">
                                                            {/* HP Icon */}
                                                            <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                </svg>
                                                            </div>

                                                            <div className="pr-8">
                                                                <div className="text-sm font-medium text-red-900">
                                                                    Level {index + 1}
                                                                </div>
                                                                <div className="text-xs text-red-600 mt-1">
                                                                    HP: {hp.toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    } else if (typeof hpData === 'object' && hpData !== null) {
                                        // Format: {"level1": 1000, "level2": 2000} - Object format
                                        return (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">Số lượng level HP:</span>
                                                    <Tag color="blue">{Object.keys(hpData).length}</Tag>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {Object.entries(hpData).map(([level, hp]: [string, any]) => (
                                                        <div key={level} className="relative p-3 bg-red-50 border border-red-200 rounded-lg">
                                                            <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                </svg>
                                                            </div>

                                                            <div className="pr-8">
                                                                <div className="text-sm font-medium text-red-900">
                                                                    {level}
                                                                </div>
                                                                <div className="text-xs text-red-600 mt-1">
                                                                    HP: {hp.toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // Fallback: Show raw JSON
                                        return (
                                            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                                                {JSON.stringify(hpData, null, 2)}
                                            </pre>
                                        );
                                    }
                                } catch {
                                    return (
                                        <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                                            {JSON.stringify(JSON.parse(boss.hp_json), null, 2)}
                                        </pre>
                                    );
                                }
                            })()}
                        </Card>

                        {/* Map Join JSON */}
                        <Card
                            title="Thông Tin Map"
                            extra="Các map mà boss có thể xuất hiện"
                        >
                            {(() => {
                                try {
                                    const mapData = JSON.parse(boss.map_join_json);
                                    if (Array.isArray(mapData)) {
                                        // New format: [1, 2, 3]
                                        return (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">Số lượng map:</span>
                                                    <Tag color="blue">{mapData.length}</Tag>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {mapData.map((mapId: number) => (
                                                        <div key={mapId} className="relative p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                            {/* Checkmark */}
                                                            <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>

                                                            <div className="pr-8">
                                                                <div className="text-sm font-medium text-blue-900">
                                                                    Map ID: {mapId}
                                                                </div>
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    Đã được chọn
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    } else if (mapData.map_ids && Array.isArray(mapData.map_ids)) {
                                        return (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">Số lượng map:</span>
                                                    <Tag color="blue">{mapData.map_ids.length}</Tag>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {mapData.map_ids.map((mapId: number) => (
                                                        <div key={mapId} className="relative p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                            {/* Checkmark */}
                                                            <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>

                                                            <div className="pr-8">
                                                                <div className="text-sm font-medium text-blue-900">
                                                                    Map ID: {mapId}
                                                                </div>
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    Đã được chọn
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                                                {JSON.stringify(mapData, null, 2)}
                                            </pre>
                                        );
                                    }
                                } catch {
                                    return (
                                        <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                                            {JSON.stringify(JSON.parse(boss.map_join_json), null, 2)}
                                        </pre>
                                    );
                                }
                            })()}
                        </Card>

                        {/* Bosses Appear Together */}
                        {boss.bosses_appear_together_json && (
                            <Card
                                title="Boss Xuất Hiện Cùng"
                                extra="Các boss xuất hiện cùng lúc"
                            >
                                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                                    {JSON.stringify(JSON.parse(boss.bosses_appear_together_json), null, 2)}
                                </pre>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Rewards */}
                        <Card
                            title="Phần Thưởng"
                            extra="Items có thể rơi từ boss"
                        >
                            {boss.boss_rewards.length > 0 ? (
                                <div className="space-y-3">
                                    {boss.boss_rewards.map((reward: any) => (
                                        <div key={reward.id} className="border border-gray-200 rounded-md p-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">Item #{reward.item_id}</span>
                                                <span className="text-sm text-gray-600">{reward.quantity}x</span>
                                            </div>
                                            <div className="mt-1">
                                                <span className="text-xs text-gray-500">Tỷ lệ rơi: {(reward.drop_rate * 100).toFixed(2)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Chưa có phần thưởng</p>
                            )}
                        </Card>

                        {/* Skills */}
                        <Card
                            title="Kỹ Năng"
                            extra="Kỹ năng của boss"
                        >
                            {boss.boss_skills.length > 0 ? (
                                <div className="space-y-3">
                                    {boss.boss_skills.map((skill: any) => (
                                        <div key={skill.id} className="border border-gray-200 rounded-md p-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">Skill #{skill.skill_id}</span>
                                                <span className="text-sm text-gray-600">Lv.{skill.skill_level}</span>
                                            </div>
                                            <div className="mt-1">
                                                <span className="text-xs text-gray-500">Cooldown: {skill.cooldown}s</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Chưa có kỹ năng</p>
                            )}
                        </Card>

                        {/* Outfits */}
                        <Card
                            title="Trang Phục"
                            extra="Trang phục của boss"
                        >
                            {boss.boss_outfits.length > 0 ? (
                                <div className="space-y-3">
                                    {boss.boss_outfits.map((outfit: any) => (
                                        <div key={outfit.id} className="border border-gray-200 rounded-md p-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">Trang phục</span>
                                                <span className="text-sm text-gray-600">Item #{outfit.item_id}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Chưa có trang phục</p>
                            )}
                        </Card>

                        {/* Texts */}
                        <Card
                            title="Văn Bản"
                            extra="Dialog và text của boss"
                        >
                            {boss.boss_texts.length > 0 ? (
                                <div className="space-y-3">
                                    {boss.boss_texts.map((text: any) => (
                                        <div key={text.id} className="border border-gray-200 rounded-md p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium capitalize">{text.text_type}</span>
                                                <span className="text-xs text-gray-500">#{text.display_order}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{text.text_content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Chưa có văn bản</p>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}