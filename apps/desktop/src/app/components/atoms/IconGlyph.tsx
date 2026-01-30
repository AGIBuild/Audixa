import type { HTMLAttributes } from 'react';
import styles from '../../app.module.css';

type IconName =
  | 'play'
  | 'pause'
  | 'prev'
  | 'next'
  | 'save'
  | 'edit'
  | 'trash'
  | 'heart'
  | 'check'
  | 'selectAll'
  | 'add'
  | 'close'
  | 'copy'
  | 'link'
  | 'refresh'
  | 'folder'
  | 'cloud'
  | 'quote'
  | 'search'
  | 'chevronLeft'
  | 'chevronRight'
  | 'playlist'
  | 'list'
  | 'open'
  | 'mask'
  | 'rate'
  | 'sort'
  | 'loop'
  | 'history'
  | 'fullscreen'
  | 'book';

type IconGlyphProps = HTMLAttributes<SVGElement> & {
  name: IconName;
  size?: number;
};

export function IconGlyph({ name, size = 18, className, ...props }: IconGlyphProps) {
  const classes = [styles.iconGlyph, className].filter(Boolean).join(' ');
  switch (name) {
    case 'play':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path d="M8 5v14l11-7z" fill="currentColor" />
        </svg>
      );
    case 'pause':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <rect x="6" y="4" width="4" height="16" fill="currentColor" />
          <rect x="14" y="4" width="4" height="16" fill="currentColor" />
        </svg>
      );
    case 'prev':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" fill="currentColor" />
        </svg>
      );
    case 'next':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6-8.5-6z" fill="currentColor" />
        </svg>
      );
    case 'save':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'edit':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M4 20h4l10-10-4-4L4 16v4z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M14 6l4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'trash':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path d="M4 7h16" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M9 7V5h6v2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M7 7l1 12h8l1-12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'heart':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M12 20s-7-4.3-7-9.3C5 8 6.7 6.5 8.8 6.5c1.5 0 2.7.8 3.2 1.9.5-1.1 1.7-1.9 3.2-1.9 2.1 0 3.8 1.6 3.8 4.2 0 5-7 9.3-7 9.3z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'check':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <polyline
            points="5 12 10 17 19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'selectAll':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <polyline
            points="7 12 11 16 18 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'add':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.8" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case 'close':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.6" />
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'copy':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <rect
            x="8"
            y="8"
            width="10"
            height="12"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M6 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'link':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M9 7h-2a4 4 0 0 0 0 8h2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M15 7h2a4 4 0 0 1 0 8h-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'refresh':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M4 12a8 8 0 0 1 13.5-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M16 3h4v4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M20 12a8 8 0 0 1-13.5 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M8 21H4v-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'folder':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'cloud':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M7 18h9a4 4 0 0 0 .5-8 5 5 0 0 0-9.7-1.5A4 4 0 0 0 7 18z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'quote':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M7 7h4v4H8v4H6V9a2 2 0 0 1 2-2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M15 7h4v4h-3v4h-2V9a2 2 0 0 1 2-2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'search':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="16" y1="16" x2="20" y2="20" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'chevronLeft':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <polyline
            points="15 6 9 12 15 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'chevronRight':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <polyline
            points="9 6 15 12 9 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'playlist':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <polygon points="4 6 8 8.5 4 11" fill="currentColor" />
          <line x1="11" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.6" />
          <line x1="11" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.6" />
          <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'list':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <rect
            x="3.5"
            y="6"
            width="17"
            height="12"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fontSize="8"
            fontFamily="Arial, sans-serif"
            fill="currentColor"
          >
            CC
          </text>
        </svg>
      );
    case 'open':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path d="M10 5h9v9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M19 5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5 9v10h10" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'mask':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
        </svg>
      );
    case 'rate':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M4 16a8 8 0 0 1 16 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <line x1="12" y1="12" x2="17" y2="9" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'sort':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path d="M7 4v16" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <polyline
            points="4 7 7 4 10 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="4 17 7 20 10 17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="14" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.6" />
          <line x1="14" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.6" />
          <line x1="14" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'book':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M6 5h9a2 2 0 0 1 2 2v12H8a2 2 0 0 0-2 2V5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <line x1="10" y1="7" x2="10" y2="20" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'history':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7v6l4 2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'fullscreen':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path d="M4 9V4h5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M20 9V4h-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 15v5h5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'loop':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={classes}
          aria-hidden="true"
          {...props}
        >
          <path
            d="M4 12a8 8 0 0 1 13.5-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M16 3h4v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M20 12a8 8 0 0 1-13.5 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 21H4v-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    default:
      return null;
  }
}
