'use client';

import { useState, useEffect } from 'react';
import { Input, Select, Space } from 'antd';

interface DurationInputProps {
    value?: number; // Value in seconds
    onChange?: (seconds: number) => void;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
}

type TimeUnit = 's' | 'm' | 'h';

export default function DurationInput({
    value = 0,
    onChange,
    error,
    placeholder = "Nhập thời gian nghỉ",
    disabled = false
}: DurationInputProps) {
    const [inputValue, setInputValue] = useState<string>('0');
    const [unit, setUnit] = useState<TimeUnit>('s');

    // Convert seconds to display value based on unit
    const convertSecondsToDisplay = (seconds: number, targetUnit: TimeUnit): string => {
        switch (targetUnit) {
            case 's':
                return seconds.toString();
            case 'm':
                return (seconds / 60).toString();
            case 'h':
                return (seconds / 3600).toString();
            default:
                return seconds.toString();
        }
    };

    // Convert display value to seconds
    const convertDisplayToSeconds = (displayValue: number, fromUnit: TimeUnit): number => {
        switch (fromUnit) {
            case 's':
                return displayValue;
            case 'm':
                return displayValue * 60;
            case 'h':
                return displayValue * 3600;
            default:
                return displayValue;
        }
    };

    // Initialize display value from prop value (only on mount)
    useEffect(() => {
        if (value !== undefined && inputValue === '0') {
            const displayValue = convertSecondsToDisplay(value, unit);
            setInputValue(displayValue);
        }
    }, [value, inputValue, unit]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValueRaw = e.target.value;
        setInputValue(newValueRaw);

        // Normalize comma to dot for decimal inputs in some locales
        const normalized = newValueRaw.replace(',', '.');
        const numericValue = parseFloat(normalized);
        const seconds = convertDisplayToSeconds(isNaN(numericValue) ? 0 : numericValue, unit);
        console.log('DurationInput - Input change:', { newValue: newValueRaw, normalized, numericValue, unit, seconds });
        onChange?.(seconds);
    };

    const handleUnitChange = (newUnit: TimeUnit) => {
        const currentNumericValue = parseFloat((inputValue || '0').replace(',', '.')) || 0;
        const currentSeconds = convertDisplayToSeconds(currentNumericValue, unit);

        setUnit(newUnit);
        const newDisplayValue = convertSecondsToDisplay(currentSeconds, newUnit);
        setInputValue(newDisplayValue);

        // The seconds value remains the same, just the display changes
        onChange?.(currentSeconds);
    };

    const getUnitLabel = (unit: TimeUnit): string => {
        switch (unit) {
            case 's': return 'giây';
            case 'm': return 'phút';
            case 'h': return 'giờ';
            default: return 'giây';
        }
    };

    return (
        <div className="space-y-2">
            <Space.Compact className="w-full">
                <Input
                    type="text"
                    inputMode="decimal"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="flex-1"
                    style={{ flex: 1, minWidth: 0 }}
                />
                <Select
                    value={unit}
                    onChange={handleUnitChange}
                    disabled={disabled}
                    className="w-20"
                    style={{ width: 96 }}
                    options={[
                        { value: 's', label: 'giây' },
                        { value: 'm', label: 'phút' },
                        { value: 'h', label: 'giờ' },
                    ]}
                />
            </Space.Compact>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}

            {/* Display converted value */}
            {parseFloat(inputValue.replace(',', '.')) > 0 && (
                <div className="text-xs text-gray-500">
                    = {value} giây ({getUnitLabel(unit)}: {inputValue})
                </div>
            )}
        </div>
    );
}
