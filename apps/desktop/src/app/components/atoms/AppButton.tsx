import type { ButtonHTMLAttributes } from 'react';
import styles from '../../app.module.css';

type ButtonVariant =
  | 'nav'
  | 'filter'
  | 'tab'
  | 'secondary'
  | 'ab';

const variantClasses: Record<ButtonVariant, string> = {
  nav: styles.navButton,
  filter: styles.filterButton,
  tab: styles.tabButton,
  secondary: styles.secondaryButton,
  ab: styles.abButton,
};

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant;
  isActive?: boolean;
  activeClassName?: string;
};

export function AppButton({
  variant,
  isActive,
  activeClassName,
  className,
  type = 'button',
  ...props
}: AppButtonProps) {
  const classes = [
    styles.buttonBase,
    variantClasses[variant],
    isActive ? activeClassName : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...props} />;
}
