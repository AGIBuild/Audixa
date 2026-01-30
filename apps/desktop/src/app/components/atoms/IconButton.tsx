import type { ButtonHTMLAttributes } from 'react';
import styles from '../../app.module.css';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
  activeClassName?: string;
};

export function IconButton({
  isActive,
  activeClassName,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const classes = [
    styles.buttonBase,
    styles.iconButton,
    isActive ? activeClassName : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...props} />;
}
