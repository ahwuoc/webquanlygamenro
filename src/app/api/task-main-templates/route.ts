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

    const where: any = {};
    if (search) {
      where.NAME = { contains: search };
    }

    const [data, totalCount] = await Promise.all([
      prisma.task_main_template.findMany({
        where,
        skip: limit ? offset : 0,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      prisma.task_main_template.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: limit
        ? { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) }
        : { page: 1, limit: totalCount, totalCount, totalPages: 1 },
    });
  } catch (error) {
    console.error('Error fetching task_main_templates:', error);
    return NextResponse.json({ error: 'Failed to fetch task main templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, NAME, detail } = body || {};

    if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'id phải là số > 0' }, { status: 400 });
    }
    if (typeof NAME !== 'string' || NAME.trim().length === 0) {
      return NextResponse.json({ error: 'NAME không được để trống' }, { status: 400 });
    }
    if (typeof detail !== 'string' || detail.trim().length === 0) {
      return NextResponse.json({ error: 'detail không được để trống' }, { status: 400 });
    }

    const exists = await prisma.task_main_template.findUnique({ where: { id } });
    if (exists) {
      return NextResponse.json({ error: 'Task main template với id này đã tồn tại' }, { status: 400 });
    }

    const created = await prisma.task_main_template.create({
      data: { id, NAME: NAME.trim(), detail: detail.trim() },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating task_main_template:', error);
    return NextResponse.json({ error: 'Failed to create task main template' }, { status: 500 });
  }
}
