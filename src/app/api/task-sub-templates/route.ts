import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/task-sub-templates - Lấy danh sách sub tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskMainId = searchParams.get('task_main_id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where = taskMainId ? { task_main_id: parseInt(taskMainId) } : {};

    const [subTasks, total] = await Promise.all([
      prisma.task_sub_template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      prisma.task_sub_template.count({ where }),
    ]);

    return NextResponse.json({
      subTasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching sub tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch sub tasks' }, { status: 500 });
  }
}

// POST /api/task-sub-templates - Tạo sub task mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_main_id, NAME, max_count, notify, npc_id, map } = body;

    if (!task_main_id || !NAME || map === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subTask = await prisma.task_sub_template.create({
      data: {
        task_main_id: parseInt(task_main_id),
        NAME,
        max_count: parseInt(max_count) || -1,
        notify: notify || '',
        npc_id: parseInt(npc_id) || -1,
        map: parseInt(map),
      },
    });

    return NextResponse.json(subTask, { status: 201 });
  } catch (error) {
    console.error('Error creating sub task:', error);
    return NextResponse.json({ error: 'Failed to create sub task' }, { status: 500 });
  }
}