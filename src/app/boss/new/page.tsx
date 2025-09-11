'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getGenderOptions } from '@/lib/utils';
import MapSelector from '@/components/MapSelector';
import OutfitSelector from '@/components/OutfitSelector';
import SkillSelector from '@/components/SkillSelector';
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

export default function NewBossPage() {
    const [genderValue, setGenderValue] = useState('1');
    const [mapJoinJson, setMapJoinJson] = useState('{}');
    const [bossOutfitsJson, setBossOutfitsJson] = useState('[]');
    const [bossSkillsJson, setBossSkillsJson] = useState('[]');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const onSubmit = async (data: BossFormData) => {
        setIsSubmitting(true);

        try {
            // Parse skills JSON and convert to the format expected by API
            const skillsData = JSON.parse(data.boss_skills_json || '[]');
            const formattedSkills = Array.isArray(skillsData)
                ? skillsData.map((skill: any) => ({
                    skill_id: skill.skillId,
                    skill_level: skill.level,
                    cooldown: skill.cooldown
                }))
                : [];

            // Parse a single selected outfit ID (or null) and convert to API format
            const selectedOutfitId = JSON.parse(data.boss_outfits_json || 'null');
            const formattedOutfits = (typeof selectedOutfitId === 'number' && selectedOutfitId > 0)
                ? [{ item_id: selectedOutfitId }]
                : [];

            const response = await fetch('/api/boss', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    bosses_appear_together_json: data.bosses_appear_together_json || null,
                    boss_skills: formattedSkills,
                    boss_outfits: formattedOutfits,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                window.location.href = `/boss/${result.id}`;
            } else {
                alert('Có lỗi xảy ra khi tạo boss');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi tạo boss');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Thêm Boss Mới</h1>
                            <p className="mt-2 text-gray-600">Tạo boss mới trong hệ thống</p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/boss">Quay Lại</Link>
                        </Button>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Thông Tin Boss</CardTitle>
                        <CardDescription>
                            Điền đầy đủ thông tin để tạo boss mới
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông Tin Cơ Bản</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="id">ID Boss *</Label>
                                        <Input
                                            id="id"
                                            type="number"
                                            {...form.register('id', { valueAsNumber: true })}
                                            placeholder="Nhập ID boss"
                                        />
                                        {form.formState.errors.id && (
                                            <p className="text-sm text-red-600">{form.formState.errors.id.message}</p>
                                        )}
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
                                        <Label htmlFor="seconds_rest">Thời Gian Nghỉ (giây)</Label>
                                        <Input
                                            id="seconds_rest"
                                            type="number"
                                            {...form.register('seconds_rest', { valueAsNumber: true })}
                                            placeholder="Nhập thời gian nghỉ"
                                        />
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
                                    <Link href="/boss">Hủy</Link>
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang tạo...' : 'Tạo Boss'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}