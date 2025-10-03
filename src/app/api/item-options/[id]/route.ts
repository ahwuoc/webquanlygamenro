import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const option = await prisma.item_option_template.findUnique({
      where: { id },
      select: { id: true, NAME: true }
    });

    if (!option) {
      return NextResponse.json({ error: 'Item option template not found' }, { status: 404 });
    }

    return NextResponse.json(option);
  } catch (error) {
    console.error('Error fetching item option template:', error);
    return NextResponse.json({ error: 'Failed to fetch item option template' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { NAME } = body;

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    if (!NAME) {
      return NextResponse.json({ error: 'NAME is required' }, { status: 400 });
    }

    const option = await prisma.item_option_template.update({
      where: { id },
      data: { NAME }
    });

    return NextResponse.json(option);
  } catch (error: any) {
    console.error('Error updating item option template:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Item option template not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update item option template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.item_option_template.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Item option template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item option template:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Item option template not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete item option template' }, { status: 500 });
  }
}
