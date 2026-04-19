interface PageHeaderProps {
  name: string;
  actions?: React.ReactNode;
}

export function PageHeader({ name, actions }: PageHeaderProps) {
  return (
    <nav className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <span className="font-semibold text-card-foreground">{name}</span>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </nav>
  );
}
