export default function GlassCard({ children, className = "" }) {
  return <div className={`panel p-4 rounded-2xl ${className}`}>{children}</div>;
}
