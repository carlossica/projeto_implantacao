// Layout dedicado pra /login — sem sidebar nem providers que dependem de auth.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
