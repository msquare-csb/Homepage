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
