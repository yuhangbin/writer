import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
