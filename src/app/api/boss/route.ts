import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';
        const offset = (page - 1) * limit;
        const where: any = {};
        if (search) {
            where.name = {
                contains: search,
            };
        }

        if (status !== 'all') {
            where.is_active = status === 'active';
        }

        const [bosses, totalCount] = await Promise.all([
            prisma.bosses.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: {
                    created_at: 'desc',
                },
                include: {
                    boss_rewards: true,
                    boss_skills: true,
                    boss_outfits: true,
                    boss_texts: true,
                },
            }),
            prisma.bosses.count({ where }),
        ]);

        return NextResponse.json({
            bosses,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching bosses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bosses' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('API POST - Received body:', body);
        console.log('API POST - seconds_rest:', body.seconds_rest);

        // Validate required fields
        if (!body.id || !body.name || !body.dame) {
            return NextResponse.json(
                { error: 'Missing required fields: id, name, dame' },
                { status: 400 }
            );
        }

        // Check if boss ID already exists
        const existingBoss = await prisma.bosses.findUnique({
            where: { id: body.id },
        });

        if (existingBoss) {
            return NextResponse.json(
                { error: 'Boss with this ID already exists' },
                { status: 400 }
            );
        }

        // Validate JSON fields
        try {
            JSON.parse(body.hp_json);
            JSON.parse(body.map_join_json);
            if (body.bosses_appear_together_json) {
                JSON.parse(body.bosses_appear_together_json);
            }
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON format' },
                { status: 400 }
            );
        }

        const boss = await prisma.bosses.create({
            data: {
                id: body.id,
                name: body.name,
                gender: body.gender || 0,
                dame: body.dame,
                hp_json: body.hp_json,
                map_join_json: body.map_join_json,
                seconds_rest: body.seconds_rest || null,
                type_appear: body.type_appear || 0,
                bosses_appear_together_json: body.bosses_appear_together_json || null,
                is_active: body.is_active !== undefined ? body.is_active : true,
            },
        });

        // Create related boss skills if provided
        if (body.boss_skills && Array.isArray(body.boss_skills) && body.boss_skills.length > 0) {
            await prisma.boss_skills.createMany({
                data: body.boss_skills.map((skill: any) => ({
                    boss_id: boss.id,
                    skill_id: skill.skill_id,
                    skill_level: skill.skill_level,
                    cooldown: skill.cooldown,
                })),
            });
        }

        // Create related boss outfits if provided
        if (body.boss_outfits && Array.isArray(body.boss_outfits) && body.boss_outfits.length > 0) {
            await prisma.boss_outfits.createMany({
                data: body.boss_outfits.map((outfit: any) => ({
                    boss_id: boss.id,
                    item_id: outfit.item_id,
                })),
            });
        }

        // Return created boss
        return NextResponse.json(boss, { status: 201 });
    } catch (error) {
        console.error('Error creating boss:', error);
        return NextResponse.json(
            { error: 'Failed to create boss' },
            { status: 500 }
        );
    }
}
