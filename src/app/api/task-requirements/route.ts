import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/task-requirements - Lấy danh sách requirements
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const taskMainId = searchParams.get('task_main_id');
        const taskSubId = searchParams.get('task_sub_id');
        const requirementType = searchParams.get('requirement_type');

        const where: any = {};
        if (taskMainId) where.task_main_id = parseInt(taskMainId);
        if (taskSubId) where.task_sub_id = parseInt(taskSubId);
        if (requirementType) where.requirement_type = requirementType;

        const requirements = await prisma.task_requirements.findMany({
            where,
            orderBy: [{ task_main_id: 'asc' }, { task_sub_id: 'asc' }, { id: 'asc' }],
        });

        return NextResponse.json({ requirements });
    } catch (error) {
        console.error('Error fetching requirements:', error);
        return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 });
    }
}

// POST /api/task-requirements - Tạo requirement mới
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            task_main_id,
            task_sub_id,
            requirement_type,
            target_id,
            target_count,
            map_restriction,
            extra_data,
            is_active
        } = body;

        if (!task_main_id || task_sub_id === undefined || !requirement_type || target_id === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const requirement = await prisma.task_requirements.create({
            data: {
                task_main_id: parseInt(task_main_id),
                task_sub_id: parseInt(task_sub_id),
                requirement_type,
                target_id: parseInt(target_id),
                target_count: parseInt(target_count) || 1,
                map_restriction,
                extra_data,
                is_active: is_active !== false,
            },
        });

        return NextResponse.json(requirement, { status: 201 });
    } catch (error) {
        console.error('Error creating requirement:', error);
        return NextResponse.json({ error: 'Failed to create requirement' }, { status: 500 });
    }
}
