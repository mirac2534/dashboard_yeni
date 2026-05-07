export function OfflineOperationPage() {
  return (
    <section className="placeholder-page">
      <span className="eyebrow">Çevrimdışı senaryo</span>
      <h2>İnternet Bağlantısı Olmadığı Operasyon</h2>
      <p>
        Bu senaryoda ana bağlantı kaybı, yerel buffer, kritik veri hash’inin yedek kanal üzerinden gönderilmesi ve
        bağlantı geri geldiğinde batch aktarım gösterilecektir.
      </p>
      <div className="soon-card">
        <strong>Yakında eklenecek</strong>
        <span>Yerel kuyruk, bağlantı geri kazanımı ve batch doğrulama akışı hazırlanıyor.</span>
      </div>
    </section>
  );
}
