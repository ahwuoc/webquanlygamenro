import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/task-main-templates - Lấy danh sách task chính
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.task_main_template.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      prisma.task_main_template.count(),
    ]);

    // Fetch related data separately
    const taskIds = tasks.map(task => task.id);
    const [subTemplates, requirements, rewards] = await Promise.all([
      prisma.task_sub_template.findMany({
        where: { task_main_id: { in: taskIds } },
      }),
      prisma.task_requirements.findMany({
        where: { task_main_id: { in: taskIds } },
      }),
      prisma.task_rewards.findMany({
        where: { task_main_id: { in: taskIds } },
      }),
    ]);

    // Combine the data
    const tasksWithRelations = tasks.map(task => ({
      ...task,
      task_sub_templates: subTemplates.filter(sub => sub.task_main_id === task.id),
      task_requirements: requirements.filter(req => req.task_main_id === task.id),
      task_rewards: rewards.filter(reward => reward.task_main_id === task.id).map(reward => ({
        ...reward,
        reward_quantity: reward.reward_quantity.toString(), // Convert BigInt to string
      })),
    }));

    return NextResponse.json({
      tasks: tasksWithRelations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching task main templates:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/task-main-templates - Tạo task chính mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, NAME, detail } = body;

    if (!id || !NAME || !detail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const task = await prisma.task_main_template.create({
      data: {
        id: parseInt(id),
        NAME,
        detail,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task main template:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}