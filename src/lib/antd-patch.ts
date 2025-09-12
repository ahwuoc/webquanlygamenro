// This file must be imported before any Ant Design components
import '@ant-design/v5-patch-for-react-19';

// Suppress the React 19 compatibility warning
if (typeof window !== 'undefined') {
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('antd v5 support React is 16 ~ 18')) {
            return; // Suppress this specific warning
        }
        originalConsoleWarn.apply(console, args);
    };
}
