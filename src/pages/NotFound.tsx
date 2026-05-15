import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md step-enter">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
          <MapPin className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-4xl text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-8">
          This page doesn&apos;t exist. Head back to start a payroll.
        </p>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/">Return to Spayroll</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
