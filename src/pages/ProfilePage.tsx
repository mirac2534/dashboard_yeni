const profileRows = [
  ['Operatör Adı', 'Synapse Demo Operator'],
  ['Rol', 'Flight Data Integrity Analyst'],
  ['Yetki', 'Read / Verify / Monitor'],
  ['Kurum', 'Synapse'],
];

export function ProfilePage() {
  return (
    <section className="placeholder-page">
      <span className="eyebrow">Demo operatör</span>
      <h2>Profil</h2>
      <p>Operatör kimliği ve demo yetkilendirme bilgileri.</p>
      <div className="profile-info-grid">
        {profileRows.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
