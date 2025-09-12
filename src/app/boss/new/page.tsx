'use client';

import { useState } from 'react';
import { getGenderOptions } from '@/lib/utils';
import MapSelector from '@/components/MapSelector';
import OutfitCombobox from '@/components/OutfitCombobox';
import SkillSelector from '@/components/SkillSelector';
import HPInput from '@/components/HPInput';
import DurationInput from '@/components/DurationInput';
import { Card } from 'antd';
import { Button, Input, Select } from 'antd';
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

        console.log('Form submit data:', data);
        console.log('seconds_rest value:', data.seconds_rest);

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
                        <Button href="/boss">Quay Lại</Button>
                    </div>
                </div>

                {/* Form */}
                <Card
                    title="Thông Tin Boss"
                    extra="Điền đầy đủ thông tin để tạo boss mới"
                >
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông Tin Cơ Bản</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="id">ID Boss *</label>
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
                                    <label htmlFor="name">Tên Boss *</label>
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
                                    <label htmlFor="gender">Hành Tinh</label>
                                    <Select
                                        value={genderValue || undefined}
                                        onChange={(value) => {
                                            setGenderValue(String(value));
                                            form.setValue('gender', parseInt(String(value)));
                                        }}
                                        placeholder="Chọn hành tinh"
                                        options={getGenderOptions().map((o) => ({ label: o.label, value: String(o.value) }))}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="dame">Sát Thương *</label>
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
                                    <label htmlFor="seconds_rest">Thời Gian Nghỉ</label>
                                    <DurationInput
                                        value={form.watch('seconds_rest')}
                                        onChange={(seconds: number) => form.setValue('seconds_rest', seconds)}
                                        placeholder="Nhập thời gian nghỉ"
                                        error={form.formState.errors.seconds_rest?.message}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="type_appear">Loại Xuất Hiện</label>
                                    <Input
                                        id="type_appear"
                                        type="number"
                                        {...form.register('type_appear', { valueAsNumber: true })}
                                        placeholder="Nhập loại xuất hiện"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label htmlFor="is_active">Trạng Thái</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            id="is_active"
                                            type="checkbox"
                                            {...form.register('is_active')}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_active" className="text-sm">Boss hoạt động</label>
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
                            <OutfitCombobox
                                value={(() => { try { const v = JSON.parse(bossOutfitsJson || 'null'); return typeof v === 'number' ? String(v) : ''; } catch { return ''; } })()}
                                onChange={(idStr) => {
                                    const json = idStr ? JSON.stringify(parseInt(idStr, 10)) : 'null';
                                    setBossOutfitsJson(json);
                                    form.setValue('boss_outfits_json', json);
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

                        {/* HP Configuration */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cấu hình HP</h2>
                            <HPInput
                                value={form.watch('hp_json')}
                                onChange={(value) => form.setValue('hp_json', value)}
                                error={form.formState.errors.hp_json?.message}
                            />
                        </div>

                        {/* Other JSON Data */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Dữ Liệu JSON Khác</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="bosses_appear_together_json">Bosses Appear Together JSON</label>
                                    <Input.TextArea
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
                            <Button href="/boss">Hủy</Button>
                            <Button htmlType="submit" type="primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang tạo...' : 'Tạo Boss'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}