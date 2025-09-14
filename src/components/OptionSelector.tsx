'use client';

import { useEffect, useState } from 'react';
import { Select } from 'antd';

interface OptionSelectorProps {
    value?: number;
    onChange?: (value: number) => void;
    placeholder?: string;
    style?: React.CSSProperties;
    loading?: boolean;
}

export default function OptionSelector({
    value,
    onChange,
    placeholder = "Chọn option...",
    style = { minWidth: 280 },
    loading = false
}: OptionSelectorProps) {
    const [options, setOptions] = useState<Array<{ value: number; label: string }>>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Load default options
    useEffect(() => {
        const loadOptions = async () => {
            try {
                setSearchLoading(true);
                const res = await fetch('/api/search/options?limit=50');
                if (res.ok) {
                    const json = await res.json();
                    const list = (json.options || []) as Array<{ id: number; NAME?: string }>;
                    const opts = list.map((op) => ({
                        value: op.id,
                        label: `${op.NAME || '#' + op.id} (#${op.id})`
                    }));
                    setOptions(opts);
                }
            } catch (e) {
                console.error('Failed to load options:', e);
            } finally {
                setSearchLoading(false);
            }
        };
        loadOptions();
    }, []);

    // Search options
    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        try {
            setSearchLoading(true);
            const res = await fetch(`/api/search/options?query=${encodeURIComponent(query)}&limit=20`);
            if (res.ok) {
                const json = await res.json();
                const list = (json.options || []) as Array<{ id: number; NAME?: string }>;
                const opts = list.map((op) => ({
                    value: op.id,
                    label: `${op.NAME || '#' + op.id} (#${op.id})`
                }));
                setOptions(opts);
            }
        } catch (e) {
            console.error('Failed to search options:', e);
        } finally {
            setSearchLoading(false);
        }
    };

    return (
        <Select
            showSearch
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            options={options}
            style={style}
            loading={loading || searchLoading}
            filterOption={false}
            onSearch={handleSearch}
            notFoundContent={searchLoading ? 'Đang tải...' : 'Không có option'}
            optionFilterProp="label"
        />
    );
}
