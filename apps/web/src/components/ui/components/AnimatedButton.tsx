import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  disabled,
  ...props 
}) => {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};