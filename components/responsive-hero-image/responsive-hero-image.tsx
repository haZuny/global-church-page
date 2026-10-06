export function ResponsiveHeroImage() {
  return (
    <div className="hero__media">
      <picture className="hero__picture">
        <source media="(max-width: 780px)" srcSet="/assets/images/church-building-mobile.png" />
        <img className="hero__image" src="/assets/images/church-building.png" alt="푸른 하늘 아래 자리한 글로벌교회 건물 전경" fetchPriority="high" />
      </picture>
      <div className="hero__veil" />
    </div>
  );
}
