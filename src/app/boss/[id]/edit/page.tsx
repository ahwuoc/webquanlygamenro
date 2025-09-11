'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getGenderOptions } from '@/lib/utils';
import MapSelector from '@/components/MapSelector';
import OutfitSelector from '@/components/OutfitSelector';
import SkillSelector from '@/components/SkillSelector';
import RewardSelector from '@/components/RewardSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const bossSchema = z.object({
    id: z.number().min(1, 'ID phải lớn hơn 0'),
    name: z.string().min(1, 'Tên boss không được để trống'),
    gender: z.number().min(0).max(2),
    dame: z.number().min(0, 'Sát thương phải lớn hơn hoặc bằng 0'),
    hp_json: z.string().refine((val) => {
        try {
            JSON.parse(val);
            return true;
        } catch {
            return false;
        }
    }, 'HP JSON không hợp lệ'),
    map_join_json: z.string().refine((val) => {
        try {
            JSON.parse(val);
            return true;
        } catch {
            return false;
        }
    }, 'Map Join JSON không hợp lệ'),
    boss_outfits_json: z.string().optional(),
    boss_skills_json: z.string().optional(),
    seconds_rest: z.number().min(0).optional(),
    type_appear: z.number().min(0),
    bosses_appear_together_json: z.string().optional(),
    is_active: z.boolean(),
});

type BossFormData = z.infer<typeof bossSchema>;

interface EditBossPageProps {
    params: {
        id: string;
    };
}

export default function EditBossPage({ params }: EditBossPageProps) {
    const router = useRouter();
    const resolvedParams = use(params as any);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [boss, setBoss] = useState<any>(null);
    const [genderValue, setGenderValue] = useState('1');
    const [mapJoinJson, setMapJoinJson] = useState('{}');
    const [bossOutfitsJson, setBossOutfitsJson] = useState('[]');
    const [bossSkillsJson, setBossSkillsJson] = useState('[]');
    const [bossRewards, setBossRewards] = useState<any[]>([]);
    // UI state for seconds_rest with unit (s, m, h)
    const [restValue, setRestValue] = useState<string>('0');
    const [restUnit, setRestUnit] = useState<'s' | 'm' | 'h'>('s');

    const form = useForm<BossFormData>({
        resolver: zodResolver(bossSchema),
        defaultValues: {
            id: 0,
            name: '',
            gender: 0,
            dame: 0,
            hp_json: '{}',
            map_join_json: '{}',
            boss_outfits_json: 'null',
            boss_skills_json: '[]',
            seconds_rest: 0,
            type_appear: 0,
            bosses_appear_together_json: '',
            is_active: true,
        },
    });

    useEffect(() => {
        const fetchBoss = async () => {
            try {
                const bossId = parseInt((resolvedParams as { id: string }).id);

                // Validate bossId
                if (isNaN(bossId) || bossId <= 0) {
                    alert('ID boss không hợp lệ');
                    router.push('/boss');
                    return;
                }

                const response = await fetch(`/api/boss/${bossId}`);
                if (response.ok) {
                    const bossData = await response.json();
                    setBoss(bossData);

                    // Convert boss_skills array to JSON string
                    const skillsJson = bossData.boss_skills ? JSON.stringify(bossData.boss_skills.map((skill: any) => ({
                        skillId: skill.skill_id,
                        level: skill.skill_level,
                        cooldown: skill.cooldown
                    }))) : '[]';

                    // Convert boss_outfits to a single selected outfit ID (first if exists)
                    const outfitsJson = bossData.boss_outfits && bossData.boss_outfits.length > 0
                        ? JSON.stringify(bossData.boss_outfits[0].item_id)
                        : 'null';

                    // Populate form with existing data
                    form.reset({
                        id: bossData.id,
                        name: bossData.name,
                        gender: bossData.gender,
                        dame: bossData.dame,
                        hp_json: bossData.hp_json,
                        map_join_json: bossData.map_join_json,
                        boss_outfits_json: outfitsJson,
                        boss_skills_json: skillsJson,
                        seconds_rest: bossData.seconds_rest || 0,
                        type_appear: bossData.type_appear || 0,
                        bosses_appear_together_json: bossData.bosses_appear_together_json || '',
                        is_active: bossData.is_active,
                    });

                    // Update local state
                    setGenderValue(bossData.gender.toString());
                    setMapJoinJson(bossData.map_join_json || '{}');
                    setBossOutfitsJson(outfitsJson);
                    setBossSkillsJson(skillsJson);
                    setBossRewards(bossData.boss_rewards || []);

                    // Initialize seconds_rest UI with best-fitting unit
                    const seconds = bossData.seconds_rest || 0;
                    if (seconds > 0 && seconds % 3600 === 0) {
                        setRestUnit('h');
                        setRestValue(String(seconds / 3600));
                    } else if (seconds > 0 && seconds % 60 === 0) {
                        setRestUnit('m');
                        setRestValue(String(seconds / 60));
                    } else {
                        setRestUnit('s');
                        setRestValue(String(seconds));
                    }
                } else {
                    alert('Không tìm thấy boss');
                    router.push('/boss');
                }
            } catch (error) {
                console.error('Error fetching boss:', error);
                alert('Có lỗi xảy ra khi tải dữ liệu boss');
                router.push('/boss');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBoss();
    }, [resolvedParams, form, router]);

    const onSubmit = async (data: BossFormData) => {
        setIsSubmitting(true);

        try {
            const bossId = parseInt((resolvedParams as { id: string }).id);

            // Validate bossId
            if (isNaN(bossId) || bossId <= 0) {
                alert('ID boss không hợp lệ');
                return;
            }

            // Parse skills JSON and convert to the format expected by API
            const skillsData = JSON.parse(data.boss_skills_json || '[]');
            const formattedSkills = skillsData.map((skill: any) => ({
                skill_id: skill.skillId,
                skill_level: skill.level,
                cooldown: skill.cooldown
            }));

            // Parse a single selected outfit ID (or null) and convert to API format
            const selectedOutfitId = JSON.parse(data.boss_outfits_json || 'null');
            const formattedOutfits = (typeof selectedOutfitId === 'number' && selectedOutfitId > 0)
                ? [{ item_id: selectedOutfitId }]
                : [];

            // Filter valid rewards (only those with valid item_id)
            const validRewards = bossRewards.filter((reward: any) =>
                reward.item_id && reward.item_id > 0
            );

            // Compute seconds_rest from UI unit/value
            const numericRest = parseFloat(restValue || '0');
            const secondsRest = isNaN(numericRest) ? 0 : (restUnit === 'h' ? Math.round(numericRest * 3600) : restUnit === 'm' ? Math.round(numericRest * 60) : Math.round(numericRest));

            const response = await fetch(`/api/boss/${bossId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    seconds_rest: secondsRest,
                    bosses_appear_together_json: data.bosses_appear_together_json || null,
                    boss_rewards: validRewards,
                    boss_skills: formattedSkills,
                    boss_outfits: formattedOutfits,
                }),
            });

            if (response.ok) {
                alert('Cập nhật boss thành công!');
                router.push(`/boss/${(resolvedParams as { id: string }).id}`);
            } else {
                const error = await response.json();
                alert(`Có lỗi xảy ra: ${error.error || 'Không thể cập nhật boss'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi cập nhật boss');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="w-full">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg">Đang tải dữ liệu...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!boss) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="w-full">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg text-red-600">Không tìm thấy boss</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="w-full">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Chỉnh Sửa Boss</h1>
                            <p className="mt-2 text-gray-600">Cập nhật thông tin boss #{boss.id}</p>
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" asChild>
                                <Link href={`/boss/${boss.id}`}>Xem Chi Tiết</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/boss">Quay Lại</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cập Nhật Thông Tin Boss</CardTitle>
                        <CardDescription>
                            Chỉnh sửa thông tin boss {boss.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông Tin Cơ Bản</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="id">ID Boss</Label>
                                        <Input
                                            id="id"
                                            type="number"
                                            {...form.register('id', { valueAsNumber: true })}
                                            disabled
                                            className="bg-gray-100"
                                        />
                                        <p className="text-xs text-gray-500">ID không thể thay đổi</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">Tên Boss *</Label>
                                        <Input
                                            id="name"
                                            {...form.register('name')}
                                            placeholder="Nhập tên boss"
                                        />
                                        {form.formState.errors.name && (
                                            <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Hành Tinh</Label>
                                        <Select
                                            value={genderValue}
                                            onValueChange={(value) => {
                                                setGenderValue(value);
                                                form.setValue('gender', parseInt(value));
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn hành tinh" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getGenderOptions().map((option) => (
                                                    <SelectItem key={option.value} value={option.value.toString()}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="dame">Sát Thương *</Label>
                                        <Input
                                            id="dame"
                                            type="number"
                                            step="0.01"
                                            {...form.register('dame', { valueAsNumber: true })}
                                            placeholder="Nhập sát thương"
                                        />
                                        {form.formState.errors.dame && (
                                            <p className="text-sm text-red-600">{form.formState.errors.dame.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="seconds_rest_value">Thời Gian Nghỉ</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="seconds_rest_value"
                                                type="number"
                                                value={restValue}
                                                onChange={(e) => setRestValue(e.target.value)}
                                                placeholder="Nhập thời gian"
                                                className="flex-1"
                                            />
                                            <Select value={restUnit} onValueChange={(v) => setRestUnit(v as 's' | 'm' | 'h')}>
                                                <SelectTrigger className="w-28">
                                                    <SelectValue placeholder="Đơn vị" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="h">Giờ</SelectItem>
                                                    <SelectItem value="m">Phút</SelectItem>
                                                    <SelectItem value="s">Giây</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type_appear">Loại Xuất Hiện</Label>
                                        <Input
                                            id="type_appear"
                                            type="number"
                                            {...form.register('type_appear', { valueAsNumber: true })}
                                            placeholder="Nhập loại xuất hiện"
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <Label htmlFor="is_active">Trạng Thái</Label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                id="is_active"
                                                type="checkbox"
                                                {...form.register('is_active')}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <Label htmlFor="is_active" className="text-sm">
                                                Boss hoạt động
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Map Selection */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Chọn Map</h2>
                                <MapSelector
                                    value={mapJoinJson}
                                    onChange={(value) => {
                                        setMapJoinJson(value);
                                        form.setValue('map_join_json', value);
                                    }}
                                    error={form.formState.errors.map_join_json?.message}
                                />
                            </div>

                            {/* Outfit Selection */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Chọn Trang Phục</h2>
                                <OutfitSelector
                                    value={bossOutfitsJson}
                                    onChange={(value) => {
                                        setBossOutfitsJson(value);
                                        form.setValue('boss_outfits_json', value);
                                    }}
                                />
                            </div>

                            {/* Skill Selection */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Chọn Kỹ Năng</h2>
                                <SkillSelector
                                    value={bossSkillsJson}
                                    onChange={(value) => {
                                        setBossSkillsJson(value);
                                        form.setValue('boss_skills_json', value);
                                    }}
                                />
                            </div>

                            {/* Reward Selection */}
                            <div>
                                <RewardSelector
                                    rewards={bossRewards}
                                    onRewardsChange={setBossRewards}
                                />
                            </div>

                            {/* JSON Data */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Dữ Liệu JSON</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hp_json">HP JSON *</Label>
                                        <Textarea
                                            id="hp_json"
                                            {...form.register('hp_json')}
                                            rows={4}
                                            className="font-mono text-sm"
                                            placeholder='{"level1": 1000, "level2": 2000}'
                                        />
                                        {form.formState.errors.hp_json && (
                                            <p className="text-sm text-red-600">{form.formState.errors.hp_json.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bosses_appear_together_json">Bosses Appear Together JSON</Label>
                                        <Textarea
                                            id="bosses_appear_together_json"
                                            {...form.register('bosses_appear_together_json')}
                                            rows={4}
                                            className="font-mono text-sm"
                                            placeholder='{"boss_ids": [1, 2, 3]}'
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-3">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={`/boss/${boss.id}`}>Hủy</Link>
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang cập nhật...' : 'Cập Nhật Boss'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
