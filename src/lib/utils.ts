import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Helper function to convert gender code to planet name
export function getGenderName(gender: number): string {
    switch (gender) {
        case 0:
            return 'Trái Đất';
        case 1:
            return 'Namek';
        case 2:
            return 'Xayda';
        default:
            return 'Không xác định';
    }
}

// Helper function to get gender options for forms
export function getGenderOptions() {
    return [
        { value: 0, label: 'Trái Đất' },
        { value: 1, label: 'Namek' },
        { value: 2, label: 'Xayda' },
    ];
}
