import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <h1 className="text-3xl font-bold text-orange-400 mb-4">404 - Page Not Found</h1>
      <p className="text-white text-lg mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link 
        href="/" 
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded transition-colors"
      >
        Go to Home
      </Link>
    </div>
  );
} 