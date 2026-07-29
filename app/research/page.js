import research from "../../data/research.json";
import researchSessions from "../../data/research-sessions.json";
import ResearchShowcase from "./ResearchShowcase";

export const metadata = {
  title: "Research | M-Square Lab",
  description: "M-Square Lab research topics and application areas."
};

const topicBySlug = new Map(research.map((topic) => [topic.slug, topic]));

const sessions = researchSessions.map((session) => ({
  ...session,
  topics: session.topics.map((item) => {
    if (!item.slug) {
      return item;
    }

    const topic = topicBySlug.get(item.slug);
    if (!topic) {
      return null;
    }

    return {
      ...item,
      title: item.title || topic.title,
      image: item.image || topic.image,
      href: item.href || `/research/${topic.slug}`
    };
  }).filter(Boolean)
}));

export default function ResearchPage() {
  return <ResearchShowcase sessions={sessions} />;
}
