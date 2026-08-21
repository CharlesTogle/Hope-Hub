import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button-variants';
import type { VariantProps } from 'class-variance-authority';

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const classNames = cn(buttonVariants({ variant, size, className }));

  if (asChild) {
    const SlotButton = Slot as unknown as React.ComponentType<React.ComponentProps<'button'>>;
    return <SlotButton data-slot="button" className={classNames} {...props} />;
  }

  return <button data-slot="button" className={classNames} {...props} />;
}

export { Button };
