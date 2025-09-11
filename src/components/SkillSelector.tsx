'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Skill {
    skillId: number;
    level: number;
    cooldown: number;
}

interface SkillSelectorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export default function SkillSelector({ value, onChange, error }: SkillSelectorProps) {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [skillTemplates, setSkillTemplates] = useState<{ id: number; NAME: string; nclass_id: number }[]>([]);
    const [loadingSkills, setLoadingSkills] = useState<boolean>(true);

    useEffect(() => {
        try {
            const parsedSkills = JSON.parse(value || '[]');
            if (Array.isArray(parsedSkills)) {
                setSkills(parsedSkills);
            }
        } catch (error) {
            console.error('Error parsing skills:', error);
            setSkills([]);
        }
    }, [value]);

    // Fetch skill templates for dropdown labels
    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const res = await fetch('/api/skills');
                if (res.ok) {
                    const data = await res.json();
                    setSkillTemplates(data || []);
                }
            } catch (e) {
                console.error('Error fetching skill templates:', e);
            } finally {
                setLoadingSkills(false);
            }
        };
        fetchSkills();
    }, []);

    // De-duplicate by skill id because skill_template uses composite key (nclass_id, id)
    const uniqueSkillTemplates = useMemo(() => {
        const byId = new Map<number, { id: number; NAME: string; nclass_id: number }>();
        for (const t of skillTemplates) {
            if (!byId.has(t.id)) {
                byId.set(t.id, t);
            }
        }
        return Array.from(byId.values());
    }, [skillTemplates]);

    // JSON editor and preview removed; component operates via form controls only

    const handleAddSkill = () => {
        const newSkill: Skill = {
            skillId: 1,
            level: 1,
            cooldown: 1000
        };
        const newSkills = [...skills, newSkill];
        setSkills(newSkills);
        onChange(JSON.stringify(newSkills));
    };

    const handleUpdateSkill = (index: number, field: keyof Skill, newValue: number) => {
        const newSkills = [...skills];
        newSkills[index] = { ...newSkills[index], [field]: newValue };
        setSkills(newSkills);
        onChange(JSON.stringify(newSkills));
    };

    const handleRemoveSkill = (index: number) => {
        const newSkills = skills.filter((_, i) => i !== index);
        setSkills(newSkills);
        onChange(JSON.stringify(newSkills));
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Kỹ Năng Boss</CardTitle>
                <CardDescription>
                    Quản lý danh sách kỹ năng của boss
                    {skills.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {skills.length} kỹ năng
                        </Badge>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Skills List */}
                    {skills.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Danh sách kỹ năng:</h4>
                            </div>

                            {skills.map((skill, index) => (
                                <div key={index} className="p-3 border rounded-lg bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <Label className="text-xs text-gray-600">Kỹ năng</Label>
                                            <Select
                                                value={String(skill.skillId)}
                                                onValueChange={(val) => handleUpdateSkill(index, 'skillId', parseInt(val))}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder={loadingSkills ? 'Đang tải...' : 'Chọn kỹ năng'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {!loadingSkills && uniqueSkillTemplates.map((tpl) => (
                                                        <SelectItem key={tpl.id} value={String(tpl.id)}>
                                                            {tpl.NAME} (#{tpl.id})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <div className="text-[11px] text-gray-500 mt-1">
                                                {(uniqueSkillTemplates.find(t => t.id === skill.skillId)?.NAME) ? (
                                                    <>Tên: {uniqueSkillTemplates.find(t => t.id === skill.skillId)!.NAME}</>
                                                ) : (
                                                    <>ID: {skill.skillId}</>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-600">Level</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="7"
                                                value={skill.level}
                                                onChange={(e) => handleUpdateSkill(index, 'level', parseInt(e.target.value) || 1)}
                                                className="h-8"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-600">Cooldown (ms)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={skill.cooldown}
                                                onChange={(e) => handleUpdateSkill(index, 'cooldown', parseInt(e.target.value) || 0)}
                                                className="h-8"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="text-xs text-gray-500">
                                            {(uniqueSkillTemplates.find(t => t.id === skill.skillId)?.NAME) ? (
                                                <>
                                                    {uniqueSkillTemplates.find(t => t.id === skill.skillId)!.NAME} (#{skill.skillId}) • Lv.{skill.level} • {skill.cooldown}ms
                                                </>
                                            ) : (
                                                <>Skill #{skill.skillId} • Lv.{skill.level} • {skill.cooldown}ms</>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemoveSkill(index)}
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Skill Button */}
                    <div className="flex justify-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddSkill}
                        >
                            + Thêm Kỹ Năng
                        </Button>
                    </div>

                    {/* JSON editor and preview removed */}

                    {/* Error Display */}
                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    {/* No JSON validation errors since editor removed */}
                </div>
            </CardContent>
        </Card>
    );
}
