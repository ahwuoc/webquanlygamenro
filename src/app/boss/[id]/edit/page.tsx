'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getGenderOptions } from '@/lib/utils';
import MapSelector from '@/components/MapSelector';
import OutfitCombobox from '@/components/OutfitCombobox';
import SkillSelector from '@/components/SkillSelector';
import RewardSelector from '@/components/RewardSelector';
import HPInput from '@/components/HPInput';
import DurationInput from '@/components/DurationInput';
import { Card, Form, Row, Col, Typography, Space, Divider } from 'antd';
import { Button, Input, Select, InputNumber, Switch } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const bossSchema = z.object({
    id: z.number().min(1, 'ID phải lớn hơn 0'),
    name: z.string().trim().min(1, 'Tên boss không được để trống'),
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
    // DurationInput will manage seconds_rest directly via form state

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

            const response = await fetch(`/api/boss/${bossId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    // seconds_rest is already the correct value in seconds from DurationInput
                    seconds_rest: data.seconds_rest,
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

    const { Title, Text } = Typography;
    const { errors } = form.formState;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Title level={2} style={{ margin: 0 }}>Chỉnh Sửa Boss</Title>
                        <Text type="secondary">Cập nhật thông tin boss #{boss.id}</Text>
                    </div>
                    <Space>
                        <Button href={`/boss/${boss.id}`}>Xem Chi Tiết</Button>
                        <Button href="/boss">Quay Lại</Button>
                    </Space>
                </div>

                <Card title={`Cập Nhật Thông Tin Boss – ${boss.name}`}>
                    <Form layout="vertical" onFinish={form.handleSubmit(onSubmit)}>
                        <Row gutter={[16, 8]}>
                            <Col xs={24} md={12}>
                                <Form.Item label="ID Boss">
                                    <Controller
                                        control={form.control}
                                        name="id"
                                        render={({ field }) => (
                                            <InputNumber id="id" value={field.value} style={{ width: '100%' }} disabled />
                                        )}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>ID không thể thay đổi</Text>
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="Tên Boss" required validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message as string}>
                                    <Controller
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <Input
                                                id="name"
                                                placeholder="Nhập tên boss"
                                                value={field.value}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                onBlur={field.onBlur}
                                            />
                                        )}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="Hành Tinh">
                                    <Select
                                        value={genderValue || undefined}
                                        onChange={(value) => {
                                            setGenderValue(String(value));
                                            form.setValue('gender', parseInt(String(value)));
                                        }}
                                        placeholder="Chọn hành tinh"
                                        options={getGenderOptions().map((option) => ({ label: option.label, value: String(option.value) }))}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="Sát Thương" required validateStatus={errors.dame ? 'error' : undefined} help={errors.dame?.message as string}>
                                    <Controller
                                        control={form.control}
                                        name="dame"
                                        render={({ field }) => (
                                            <InputNumber
                                                id="dame"
                                                step={0.01}
                                                min={0}
                                                style={{ width: '100%' }}
                                                placeholder="Nhập sát thương"
                                                value={field.value}
                                                onChange={(val) => field.onChange(typeof val === 'number' ? val : 0)}
                                            />
                                        )}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="Thời Gian Nghỉ" validateStatus={errors.seconds_rest ? 'error' : undefined} help={errors.seconds_rest?.message as string}>
                                    <DurationInput
                                        value={form.watch('seconds_rest')}
                                        onChange={(seconds) => form.setValue('seconds_rest', seconds)}
                                        placeholder="Nhập thời gian nghỉ"
                                        error={form.formState.errors.seconds_rest?.message}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24}>
                                <Form.Item label="Trạng Thái">
                                    <Space align="center">
                                        <Controller
                                            control={form.control}
                                            name="is_active"
                                            render={({ field }) => (
                                                <Switch
                                                    id="is_active"
                                                    checked={!!field.value}
                                                    onChange={(checked) => field.onChange(checked)}
                                                />
                                            )}
                                        />
                                        <Text>Boss hoạt động</Text>
                                    </Space>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />

                        <Row gutter={[16, 8]}>
                            <Col span={24}>
                                <Form.Item label="Chọn Map" validateStatus={errors.map_join_json ? 'error' : undefined} help={errors.map_join_json?.message as string}>
                                    <MapSelector
                                        value={mapJoinJson}
                                        onChange={(value) => {
                                            setMapJoinJson(value);
                                            form.setValue('map_join_json', value);
                                        }}
                                        error={form.formState.errors.map_join_json?.message}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={24}>
                                <Form.Item label="Chọn Trang Phục">
                                    <OutfitCombobox
                                        value={(() => { try { const v = JSON.parse(bossOutfitsJson || 'null'); return typeof v === 'number' ? String(v) : ''; } catch { return ''; } })()}
                                        onChange={(idStr) => {
                                            const json = idStr ? JSON.stringify(parseInt(idStr, 10)) : 'null';
                                            setBossOutfitsJson(json);
                                            form.setValue('boss_outfits_json', json);
                                        }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={24}>
                                <Form.Item label="Chọn Kỹ Năng">
                                    <SkillSelector
                                        value={bossSkillsJson}
                                        onChange={(value) => {
                                            setBossSkillsJson(value);
                                            form.setValue('boss_skills_json', value);
                                        }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={24}>
                                <Form.Item label="Phần Thưởng">
                                    <RewardSelector
                                        rewards={bossRewards}
                                        onRewardsChange={setBossRewards}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={24}>
                                <Form.Item label="Cấu hình HP" validateStatus={errors.hp_json ? 'error' : undefined} help={errors.hp_json?.message as string}>
                                    <HPInput
                                        value={form.watch('hp_json')}
                                        onChange={(value) => form.setValue('hp_json', value)}
                                        error={form.formState.errors.hp_json?.message}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={24}>
                                <Form.Item label="Bosses Appear Together JSON">
                                    <Input.TextArea
                                        id="bosses_appear_together_json"
                                        {...form.register('bosses_appear_together_json')}
                                        rows={4}
                                        className="font-mono text-sm"
                                        placeholder='{"boss_ids": [1, 2, 3]}'
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <div className="flex justify-end">
                            <Space>
                                <Button href={`/boss/${boss.id}`}>Hủy</Button>
                                <Button htmlType="submit" type="primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang cập nhật...' : 'Cập Nhật Boss'}
                                </Button>
                            </Space>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
