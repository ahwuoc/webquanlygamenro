import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = searchParams.get('limit') || '10';
    const limit = limitParam === 'all' ? undefined : parseInt(limitParam, 10);
    const offset = limit ? (page - 1) * limit : 0;

    const code = searchParams.get('code')?.trim() || '';
    const type = searchParams.get('type'); // number | 'all'
    const active = searchParams.get('active'); // 'all' | '1' | '0'

    const where: any = {};

    if (code) {
      where.code = { contains: code };
    }

    if (type && type !== 'all') {
      const t = parseInt(type, 10);
      if (!Number.isNaN(t)) where.type = t;
    }

    if (active && active !== 'all') {
      where.active = parseInt(active, 10);
    }

    const [data, totalCount] = await Promise.all([
      prisma.giftcode.findMany({
        where,
        skip: limit ? offset : 0,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      prisma.giftcode.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: limit
        ? {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          }
        : { page: 1, limit: totalCount, totalCount, totalPages: 1 },
    });
  } catch (error) {
    console.error('Error fetching giftcodes:', error);
    return NextResponse.json({ error: 'Failed to fetch giftcodes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      code,
      type = 0,
      Delete = true,
      limit = 0,
      listUser = '[]',
      listItem = '[]',
      bagCount = true,
      itemoption = '[]',
      active = 0,
    } = body || {};

    // Basic validation
    if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'id phải là số > 0' }, { status: 400 });
    }
    if (typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json({ error: 'code không được để trống' }, { status: 400 });
    }

    // Check exists by id
    const exists = await prisma.giftcode.findUnique({ where: { id } });
    if (exists) {
      return NextResponse.json({ error: 'Giftcode với id này đã tồn tại' }, { status: 400 });
    }

    // Ensure long text strings are strings
    const gc = await prisma.giftcode.create({
      data: {
        id,
        code: String(code).trim(),
        type: Number(type) || 0,
        Delete: Boolean(Delete),
        limit: Number(limit) || 0,
        listUser: typeof listUser === 'string' ? listUser : JSON.stringify(listUser),
        listItem: typeof listItem === 'string' ? listItem : JSON.stringify(listItem),
        bagCount: Boolean(bagCount),
        itemoption: typeof itemoption === 'string' ? itemoption : JSON.stringify(itemoption),
        active: Number(active) || 0,
      },
    });

    return NextResponse.json(gc, { status: 201 });
  } catch (error) {
    console.error('Error creating giftcode:', error);
    return NextResponse.json({ error: 'Failed to create giftcode' }, { status: 500 });
  }
}
