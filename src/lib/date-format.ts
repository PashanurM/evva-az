const MONTHS_AZ = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "İyun",
  "İyul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
] as const;

const MONTHS_RU = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

const MONTHS_RU_NOMINATIVE = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTHS_EN_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Avoid az-AZ Intl — Chromium returns broken months like "M07". */
export function formatDateDisplay(
  date: Date,
  locale: string = "az",
): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  if (locale === "ru") {
    return `${date.getDate()} ${MONTHS_RU[date.getMonth()]} ${year}`;
  }
  if (locale === "en") {
    return `${MONTHS_EN_SHORT[date.getMonth()]} ${date.getDate()}, ${year}`;
  }
  return `${day}.${month}.${year}`;
}

export function formatMonthYear(
  date: Date,
  locale: string = "az",
): string {
  const year = date.getFullYear();
  if (locale === "ru") {
    return `${MONTHS_RU_NOMINATIVE[date.getMonth()]} ${year}`;
  }
  if (locale === "en") {
    return `${MONTHS_EN[date.getMonth()]} ${year}`;
  }
  return `${MONTHS_AZ[date.getMonth()]} ${year}`;
}
