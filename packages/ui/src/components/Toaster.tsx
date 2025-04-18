import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from './ThemeContext';

export const Toaster = () => {
    const { theme } = useTheme();
    return (
        <SonnerToaster
            expand={true}
            position="top-right"
            richColors
            duration={2000}
            theme={theme}
            className="toaster"
        />
    );
};