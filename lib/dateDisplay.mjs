const abbreviatedMonths = [
  "Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.",
  "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."
];

export function formatActivityDate(date) {
  const [year, month, day] = date.split("-");
  return `${abbreviatedMonths[Number(month) - 1]} ${Number(day)}, ${year}`;
}

export function formatMonthDayYear(date) {
  if (typeof date !== "string") {
    return "";
  }

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return date;
  }

  return `${month}/${day}/${year}`;
}
