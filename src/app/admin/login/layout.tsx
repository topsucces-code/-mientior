export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout overrides the parent admin layout for the login page
  // to show a clean login form without the admin sidebar/header
  return <>{children}</>
}
