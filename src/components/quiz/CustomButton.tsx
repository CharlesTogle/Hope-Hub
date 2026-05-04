import { useState } from 'react';
import { motion } from 'motion/react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

interface CustomButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof motion.button>, 'children'> {
  children: ReactNode;
}

export default function CustomButton({
  className,
  onClick,
  children,
  ...props
}: CustomButtonProps) {
  const [isDisabled, setIsDisabled] = useState(false);

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      animate={{ rotate: 0 }}
      whileHover={
        props.disabled
          ? {}
          : {
              scale: 1.05,
              rotate: [-2, 2, -2, 2],
              transition: { duration: 0.3 },
            }
      }
      whileTap={
        props.disabled
          ? {}
          : {
              scale: 0.95,
            }
      }
      className={`${className} cursor-pointer`}
      onClick={(event) => {
        setIsDisabled(true);
        onClick?.(event);
      }}
      disabled={isDisabled || props.disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
