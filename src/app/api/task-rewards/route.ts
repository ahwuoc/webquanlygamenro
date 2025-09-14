import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/task-rewards - Lấy danh sách rewards
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const taskMainId = searchParams.get('task_main_id');
        const taskSubId = searchParams.get('task_sub_id');
        const rewardType = searchParams.get('reward_type');

        const where: any = {};
        if (taskMainId) where.task_main_id = parseInt(taskMainId);
        if (taskSubId) where.task_sub_id = parseInt(taskSubId);
        if (rewardType) where.reward_type = rewardType;

        const rewardsRaw = await prisma.task_rewards.findMany({
            where,
            orderBy: [{ task_main_id: 'asc' }, { task_sub_id: 'asc' }, { id: 'asc' }],
        });

        const rewards = rewardsRaw.map(r => ({
            ...r,
            reward_quantity: r.reward_quantity?.toString?.() ?? r.reward_quantity as any,
        }));

        return NextResponse.json({ rewards });
    } catch (error) {
        console.error('Error fetching rewards:', error);
        return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }
}

// POST /api/task-rewards - Tạo reward mới
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            task_main_id,
            task_sub_id,
            reward_type,
            reward_id,
            reward_quantity,
            reward_description
        } = body;

        if (!task_main_id || task_sub_id === undefined || !reward_type || reward_quantity === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const reward = await prisma.task_rewards.create({
            data: {
                task_main_id: parseInt(task_main_id),
                task_sub_id: parseInt(task_sub_id),
                reward_type,
                reward_id: parseInt(reward_id) || 0,
                reward_quantity: BigInt(reward_quantity),
                reward_description,
            },
        });

        return NextResponse.json(reward, { status: 201 });
    } catch (error) {
        console.error('Error creating reward:', error);
        return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
    }
}
