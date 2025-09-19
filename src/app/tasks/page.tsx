import TasksManager from '@/components/TasksManager';

export default function TaskManagementPage() {
    // Render client-side manager (avoid SSR data-fetch here for richer UX)
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="w-full">
                <TasksManager />
            </div>
        </div>
    );
}
