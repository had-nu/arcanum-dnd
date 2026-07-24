import { Link } from 'wouter';
import { Home, Search } from 'lucide-preact';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <div className="text-9xl font-bold text-dnd-stone-200 dark:text-dnd-stone-700 mb-4">404</div>
        <h1 className="text-3xl font-bold text-dnd-stone-900 dark:text-dnd-stone-100 mb-3">
          Page Not Found
        </h1>
        <p className="text-dnd-stone-600 dark:text-dnd-stone-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/builder">
            <Button>
              <Search className="h-4 w-4 mr-2" /> Build a Character
            </Button>
          </Link>
          <Link href="/characters">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" /> View Characters
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}