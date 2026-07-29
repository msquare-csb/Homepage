import newsItems from "../../data/news.json";
import { withBasePath } from "../../lib/basePath";
import { formatMonthDayYear } from "../../lib/dateDisplay.mjs";

const sortedNewsItems = [...newsItems].sort((a, b) => {
  const dateOrder = b.date.localeCompare(a.date);
  if (dateOrder !== 0) return dateOrder;
  return (a.sortOrder ?? 50) - (b.sortOrder ?? 50);
});

export default function NewsPage() {
  return (
    <div>
      <section className="section">
        <h1>News</h1>
      </section>

      <section className="section newsSection">
        <div className="newsCardList">
          {sortedNewsItems.map((item) =>
            item.image ? (
              <details
                key={item.id}
                className="card newsSimpleItem newsSimpleCard newsPhotoCard"
              >
                <summary className="newsPhotoSummary">
                  <span className="newsPhotoSummaryCopy">
                    <span className="newsSimpleHead">
                      <span className="newsSimpleDate">{formatMonthDayYear(item.date)}</span>
                      <span className="newsSimpleTitle">{item.title}</span>
                    </span>
                    <span className="newsSimpleText">{item.text}</span>
                  </span>
                  <svg
                    className="newsCardToggle"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                  <div className="newsImagePanel">
                    <img
                      className="newsSimpleImage"
                      src={withBasePath(item.image)}
                      alt={item.imageAlt || item.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
              </details>
            ) : (
              <article key={item.id} className="card newsSimpleItem newsSimpleCard">
                <p className="newsSimpleHead">
                  <span className="newsSimpleDate">{formatMonthDayYear(item.date)}</span>
                  <span className="newsSimpleTitle">{item.title}</span>
                </p>
                <p className="newsSimpleText">{item.text}</p>
              </article>
            )
          )}
        </div>
      </section>
    </div>
  );
}
