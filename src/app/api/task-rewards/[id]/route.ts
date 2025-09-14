import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/task-rewards/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const rewardId = parseInt(id, 10);
    const reward = await prisma.task_rewards.findUnique({ where: { id: rewardId } });
    if (!reward) return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    return NextResponse.json(reward);
  } catch (error) {
    console.error('Error fetching reward:', error);
    return NextResponse.json({ error: 'Failed to fetch reward' }, { status: 500 });
  }
}

// PUT /api/task-rewards/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const rewardId = parseInt(id, 10);
    const body = await request.json();
    const { task_main_id, task_sub_id, reward_type, reward_id, reward_quantity, reward_description } = body;

    const reward = await prisma.task_rewards.update({
      where: { id: rewardId },
      data: {
        task_main_id: task_main_id !== undefined ? parseInt(task_main_id) : undefined,
        task_sub_id: task_sub_id !== undefined ? parseInt(task_sub_id) : undefined,
        reward_type,
        reward_id: reward_id !== undefined ? parseInt(reward_id) : undefined,
        reward_quantity: reward_quantity !== undefined ? BigInt(reward_quantity) : undefined,
        reward_description,
      },
    });

    return NextResponse.json(reward);
  } catch (error) {
    console.error('Error updating reward:', error);
    return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 });
  }
}

// DELETE /api/task-rewards/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const rewardId = parseInt(id, 10);
    await prisma.task_rewards.delete({ where: { id: rewardId } });
    return NextResponse.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    console.error('Error deleting reward:', error);
    return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
  }
}
