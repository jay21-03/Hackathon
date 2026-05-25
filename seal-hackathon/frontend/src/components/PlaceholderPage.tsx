interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p>Skeleton page ready for upcoming implementation.</p>
    </section>
  );
}
