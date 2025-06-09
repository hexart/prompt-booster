// packages/ui/src/components/Toaster.tsx
import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from './ThemeContext';

export interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

export const Toaster = ({ position = 'top-right' }: ToasterProps) => {
  const { theme } = useTheme();
  return (
    <SonnerToaster
      expand={true}
      position={position}
      richColors
      duration={2000}
      theme={theme}
      className="toaster"
    />
  );
};