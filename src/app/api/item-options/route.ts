import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit') || '10';
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          OR: [
            { NAME: { contains: search, mode: 'insensitive' as const } },
            { id: isNaN(parseInt(search)) ? undefined : parseInt(search) }
          ].filter(Boolean)
        }
      : {};

    // Handle "all" limit for dropdown usage
    if (limitParam === 'all') {
      const options = await prisma.item_option_template.findMany({
        where,
        select: { id: true, NAME: true },
        orderBy: { id: 'asc' },
      });
      return NextResponse.json(options);
    }

    const limit = parseInt(limitParam);
    const [options, total] = await Promise.all([
      prisma.item_option_template.findMany({
        where,
        select: { id: true, NAME: true },
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.item_option_template.count({ where })
    ]);

    return NextResponse.json({
      data: options,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching item option templates:', error);
    return NextResponse.json({ error: 'Failed to fetch item option templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, NAME } = body;

    if (!id || !NAME) {
      return NextResponse.json({ error: 'ID and NAME are required' }, { status: 400 });
    }

    const option = await prisma.item_option_template.create({
      data: { id, NAME }
    });

    return NextResponse.json(option, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item option template:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Item option template with this ID already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create item option template' }, { status: 500 });
  }
}
