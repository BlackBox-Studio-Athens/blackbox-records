import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { returnStaffTask, staffReturn } from '../lib/staff-navigation';

export default function StaffBack() {
  const [target, setTarget] = useState({ url: '/', label: 'Overview' });
  const leaving = useRef(false);
  useEffect(() => {
    const update = () => {
      leaving.current = false;
      setTarget(staffReturn());
    };
    update();
    window.addEventListener('staff:navigation', update);
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener('staff:navigation', update);
      window.removeEventListener('popstate', update);
    };
  }, []);
  return (
    <Button variant="ghost" className="min-h-11 justify-start whitespace-normal" asChild>
      <a
        href={target.url}
        data-staff-back
        onClick={(event) => {
          if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
          )
            return;
          event.preventDefault();
          if (leaving.current) return;
          leaving.current = true;
          returnStaffTask();
        }}
      >
        <ArrowLeft aria-hidden="true" />
        Back to {target.label}
      </a>
    </Button>
  );
}
