import type { ButtonHTMLAttributes } from 'react';
import styles from '../../app.module.css';

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
  activeClassName?: string;
};

export function PrimaryButton({
  isActive,
  activeClassName,
  className,
  type = 'button',
  ...props
}: PrimaryButtonProps) {
  const classes = [
    styles.buttonBase,
    styles.primaryButton,
    isActive ? activeClassName : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...props} />;
}
