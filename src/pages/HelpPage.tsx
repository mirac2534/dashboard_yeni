const questions = [
  'Bu sistem gerçek kara kutunun yerine mi geçer?',
  'Hash ne işe yarar?',
  'Off-chain veri ne demektir?',
  'Blockchain’de neden ham veri tutulmaz?',
  'Verification ne anlama gelir?',
];

export function HelpPage() {
  return (
    <section className="placeholder-page">
      <span className="eyebrow">Yardım merkezi</span>
      <h2>Yardım ve Sıkça Sorulan Sorular</h2>
      <p>Sunum sırasında açıklanacak temel kavramlar ve sıkça sorulan sorular.</p>
      <div className="faq-list">
        {questions.map((question) => (
          <article key={question}>
            <strong>{question}</strong>
            <span>Yakında eklenecek</span>
          </article>
        ))}
      </div>
    </section>
  );
}
