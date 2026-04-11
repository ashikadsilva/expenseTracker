import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const STORAGE_PREFIX = 'expense_tracker_walkthrough_v1_';

/**
 * One-time spotlight tour for signed-in cloud users after data is ready.
 */
export function useWalkthrough(userId, enabled) {
  useEffect(() => {
    if (!enabled || !userId) return;
    const key = STORAGE_PREFIX + userId;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const d = driver({
        showProgress: true,
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Done',
        onDestroyed: () => {
          try {
            localStorage.setItem(key, '1');
          } catch {
            /* ignore */
          }
        },
        steps: [
          {
            element: '[data-tour="topbar"]',
            popover: {
              title: 'Header & quick actions',
              description:
                'Import bank Excel files, export CSV, or add a transaction manually from here.',
            },
          },
          {
            element: '[data-tour="tabs"]',
            popover: {
              title: 'Main sections',
              description:
                'Switch between Dashboard charts, Transactions, Categories, Monthly statement, and Import.',
            },
          },
          {
            element: '[data-tour="tab-dashboard"]',
            popover: {
              title: 'Dashboard',
              description:
                'See spending summaries, trends, and budget-style views for your accounts.',
            },
          },
          {
            element: '[data-tour="btn-import"]',
            popover: {
              title: 'Import',
              description:
                'Upload your .xlsx summaries to pull in transactions and balances.',
            },
          },
          {
            element: '[data-tour="btn-add-entry"]',
            popover: {
              title: 'Add entry',
              description:
                'Record income or expenses by hand when you do not have a sheet handy.',
            },
          },
        ],
      });
      d.drive();
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, userId]);
}
