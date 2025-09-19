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
    if (rewardType) where.reward_type = rewardType as any;
    if (taskMainId || taskSubId) {
      where.requirement = {};
      if (taskMainId) where.requirement.task_main_id = parseInt(taskMainId);
      if (taskSubId) where.requirement.task_sub_id = parseInt(taskSubId);
    }

    const rewardsRaw = await prisma.task_rewards.findMany({
      where,
      include: { requirement: true },
      orderBy: [
        { requirement: { task_main_id: 'asc' } },
        { requirement: { task_sub_id: 'asc' } },
        { id: 'asc' },
      ],
    });

    const rewards = rewardsRaw.map(r => ({
      id: r.id,
      requirement_id: r.requirement_id,
      reward_type: r.reward_type,
      reward_id: r.reward_id,
      reward_quantity: (r.reward_quantity as any)?.toString?.() ?? (r.reward_quantity as any),
      reward_description: r.reward_description,
      // expose legacy fields for UI convenience
      task_main_id: r.requirement?.task_main_id,
      task_sub_id: r.requirement?.task_sub_id,
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
      requirement_id,
      task_main_id,
      task_sub_id,
      reward_type,
      reward_id,
      reward_quantity,
      reward_description,
    } = body || {};

    if (!reward_type || reward_quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields: reward_type, reward_quantity' }, { status: 400 });
    }

    let reqId: number | null = requirement_id ? parseInt(requirement_id) : null;
    if (!reqId) {
      if (task_main_id === undefined || task_sub_id === undefined) {
        return NextResponse.json({ error: 'Provide requirement_id or (task_main_id, task_sub_id)' }, { status: 400 });
      }
      const found = await prisma.task_requirements.findFirst({
        where: { task_main_id: parseInt(task_main_id), task_sub_id: parseInt(task_sub_id) },
        orderBy: { id: 'asc' },
      });
      if (!found) return NextResponse.json({ error: 'No requirement found for given (task_main_id, task_sub_id)' }, { status: 404 });
      reqId = found.id;
    }

    const created = await prisma.task_rewards.create({
      data: {
        requirement_id: reqId,
        reward_type,
        reward_id: reward_id != null ? parseInt(reward_id) : 0,
        reward_quantity: BigInt(reward_quantity),
        reward_description,
      },
      include: { requirement: true },
    });

    const payload = {
      id: created.id,
      requirement_id: created.requirement_id,
      reward_type: created.reward_type,
      reward_id: created.reward_id,
      reward_quantity: (created.reward_quantity as any)?.toString?.() ?? (created.reward_quantity as any),
      reward_description: created.reward_description,
      task_main_id: created.requirement?.task_main_id,
      task_sub_id: created.requirement?.task_sub_id,
    };

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
  }
}
