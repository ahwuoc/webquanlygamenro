import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = searchParams.get('limit') || '10';
    const limit = limitParam === 'all' ? undefined : parseInt(limitParam, 10);
    const offset = limit ? (page - 1) * limit : 0;

    const search = searchParams.get('search')?.trim() || '';
    const task_main_id = searchParams.get('task_main_id');

    const where: any = {};
    if (task_main_id) {
      const tid = parseInt(task_main_id, 10);
      if (!Number.isNaN(tid)) where.task_main_id = tid;
    }
    if (search) {
      where.NAME = { contains: search };
    }

    const [data, totalCount] = await Promise.all([
      prisma.task_sub_template.findMany({
        where,
        skip: limit ? offset : 0,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      prisma.task_sub_template.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: limit
        ? { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) }
        : { page: 1, limit: totalCount, totalCount, totalPages: 1 },
    });
  } catch (error) {
    console.error('Error fetching task_sub_templates:', error);
    return NextResponse.json({ error: 'Failed to fetch task sub templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_main_id, NAME, max_count = -1, notify = '', npc_id = -1, map } = body || {};

    if (typeof task_main_id !== 'number' || !Number.isFinite(task_main_id) || task_main_id <= 0) {
      return NextResponse.json({ error: 'task_main_id phải là số > 0' }, { status: 400 });
    }
    if (typeof NAME !== 'string' || NAME.trim().length === 0) {
      return NextResponse.json({ error: 'NAME không được để trống' }, { status: 400 });
    }
    const created = await prisma.task_sub_template.create({
      data: {
        task_main_id,
        NAME: NAME.trim(),
        max_count: Number(max_count),
        notify: String(notify),
        npc_id: Number(npc_id),
        map: typeof map === 'number' ? map : 0,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating task_sub_template:', error);
    return NextResponse.json({ error: 'Failed to create task sub template' }, { status: 500 });
  }
}
