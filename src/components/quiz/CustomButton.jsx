import { useState } from 'react';
import { motion } from 'motion/react';

export default function CustomButton({ className, onClick, ...props }) {
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
      onClick={() => {
        setIsDisabled(true);
        onClick();
      }}
      disabled={isDisabled || props.disabled}
      {...props}
    >
      {props.children}
    </motion.button>
  );
}
