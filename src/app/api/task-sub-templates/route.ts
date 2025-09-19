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

    const where: any = {};
    if (taskMainId) where.task_main_id = parseInt(taskMainId, 10);

    // Lấy requirements và group theo (task_main_id, task_sub_id)
    const all = await prisma.task_requirements.findMany({
      where,
      orderBy: [{ task_main_id: 'asc' }, { task_sub_id: 'asc' }, { id: 'asc' }],
    });

    const groupsMap = new Map<string, { task_main_id: number; task_sub_id: number; max_count: number }>();
    for (const r of all) {
      const key = `${r.task_main_id}_${r.task_sub_id}`;
      const prev = groupsMap.get(key);
      const maxCount = Math.max(prev?.max_count ?? -1, r.target_count ?? 1);
      groupsMap.set(key, { task_main_id: r.task_main_id, task_sub_id: r.task_sub_id, max_count: maxCount });
    }

    const grouped = Array.from(groupsMap.values());
    const total = grouped.length;
    const paged = grouped.slice(skip, skip + limit);

    // Trả về cấu trúc tương tự sub template (compat) nhưng chỉ có trường cơ bản
    const subTasks = paged.map(g => ({
      id: undefined, // không còn id sub template
      task_main_id: g.task_main_id,
      NAME: null,
      max_count: g.max_count,
      notify: null,
      npc_id: -1,
      map: -1,
      task_sub_id: g.task_sub_id,
    }));

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
export async function POST(_request: NextRequest) {
  // Deprecated theo thiết kế mới: Sub task được sinh ra từ task_requirements
  return NextResponse.json({ error: 'Deprecated. Tạo sub task bằng cách tạo task_requirements tương ứng.' }, { status: 410 });
}