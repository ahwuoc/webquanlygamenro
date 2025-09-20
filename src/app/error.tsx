'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Có lỗi xảy ra!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.
                    </p>
                    <button
                        onClick={reset}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        </div>
    );
}
