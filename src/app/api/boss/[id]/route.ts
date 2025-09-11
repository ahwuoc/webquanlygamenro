import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const resolvedParams = await params;
        const bossId = parseInt(resolvedParams.id);

        // Validate bossId
        if (isNaN(bossId) || bossId <= 0) {
            return NextResponse.json(
                { error: 'Invalid boss ID' },
                { status: 400 }
            );
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
            return NextResponse.json(
                { error: 'Boss not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(boss);
    } catch (error) {
        console.error('Error fetching boss:', error);
        return NextResponse.json(
            { error: 'Failed to fetch boss' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const resolvedParams = await params;
        const bossId = parseInt(resolvedParams.id);

        // Validate bossId
        if (isNaN(bossId) || bossId <= 0) {
            return NextResponse.json(
                { error: 'Invalid boss ID' },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Check if boss exists
        const existingBoss = await prisma.bosses.findUnique({
            where: { id: bossId },
        });

        if (!existingBoss) {
            return NextResponse.json(
                { error: 'Boss not found' },
                { status: 404 }
            );
        }

        // Validate JSON fields if provided
        if (body.hp_json) {
            try {
                JSON.parse(body.hp_json);
            } catch (error) {
                return NextResponse.json(
                    { error: 'Invalid hp_json format' },
                    { status: 400 }
                );
            }
        }

        if (body.map_join_json) {
            try {
                JSON.parse(body.map_join_json);
            } catch (error) {
                return NextResponse.json(
                    { error: 'Invalid map_join_json format' },
                    { status: 400 }
                );
            }
        }

        if (body.bosses_appear_together_json) {
            try {
                JSON.parse(body.bosses_appear_together_json);
            } catch (error) {
                return NextResponse.json(
                    { error: 'Invalid bosses_appear_together_json format' },
                    { status: 400 }
                );
            }
        }

        // Update boss data
        await prisma.bosses.update({
            where: { id: bossId },
            data: {
                name: body.name,
                gender: body.gender,
                dame: body.dame,
                hp_json: body.hp_json,
                map_join_json: body.map_join_json,
                seconds_rest: body.seconds_rest,
                type_appear: body.type_appear,
                bosses_appear_together_json: body.bosses_appear_together_json,
                is_active: body.is_active,
                updated_at: new Date(),
            },
        });

        // Handle boss skills if provided
        if (body.boss_skills && Array.isArray(body.boss_skills)) {
            // Delete existing skills
            await prisma.boss_skills.deleteMany({
                where: { boss_id: bossId }
            });

            // Create new skills
            if (body.boss_skills.length > 0) {
                await prisma.boss_skills.createMany({
                    data: body.boss_skills.map((skill: any) => ({
                        boss_id: bossId,
                        skill_id: skill.skill_id,
                        skill_level: skill.skill_level,
                        cooldown: skill.cooldown,
                    }))
                });
            }
        }

        // Handle boss outfits if provided
        if (body.boss_outfits && Array.isArray(body.boss_outfits)) {
            // Delete existing outfits
            await prisma.boss_outfits.deleteMany({
                where: { boss_id: bossId }
            });

            // Create new outfits
            if (body.boss_outfits.length > 0) {
                await prisma.boss_outfits.createMany({
                    data: body.boss_outfits.map((outfit: any) => ({
                        boss_id: bossId,
                        item_id: outfit.item_id,
                    }))
                });
            }
        }

        // Handle boss rewards if provided
        if (body.boss_rewards && Array.isArray(body.boss_rewards)) {
            // Delete existing rewards
            await prisma.boss_rewards.deleteMany({
                where: { boss_id: bossId }
            });

            // Create new rewards
            if (body.boss_rewards.length > 0) {
                const validRewards = body.boss_rewards.filter((reward: any) =>
                    reward.item_id && reward.item_id > 0
                );

                if (validRewards.length > 0) {
                    await prisma.boss_rewards.createMany({
                        data: validRewards.map((reward: any) => ({
                            boss_id: bossId,
                            item_id: reward.item_id,
                            quantity: reward.quantity,
                            drop_rate: reward.drop_rate,
                        }))
                    });
                }
            }
        }

        // Return updated boss with rewards
        const updatedBoss = await prisma.bosses.findUnique({
            where: { id: bossId },
            include: {
                boss_rewards: true,
                boss_skills: true,
                boss_outfits: true,
                boss_texts: true,
            },
        });

        return NextResponse.json(updatedBoss);
    } catch (error) {
        console.error('Error updating boss:', error);
        return NextResponse.json(
            { error: 'Failed to update boss' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const resolvedParams = await params;
        const bossId = parseInt(resolvedParams.id);

        // Validate bossId
        if (isNaN(bossId) || bossId <= 0) {
            return NextResponse.json(
                { error: 'Invalid boss ID' },
                { status: 400 }
            );
        }

        // Check if boss exists
        const existingBoss = await prisma.bosses.findUnique({
            where: { id: bossId },
        });

        if (!existingBoss) {
            return NextResponse.json(
                { error: 'Boss not found' },
                { status: 404 }
            );
        }

        // Delete boss (cascade will handle related records)
        await prisma.bosses.delete({
            where: { id: bossId },
        });

        return NextResponse.json(
            { message: 'Boss deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting boss:', error);
        return NextResponse.json(
            { error: 'Failed to delete boss' },
            { status: 500 }
        );
    }
}
