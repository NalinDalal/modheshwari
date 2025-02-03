import moment from "moment-hijri";

export function getHinduDate(date: Date): string {
  const hinduDate = moment(date).format("iD iMMMM iYYYY");
  return hinduDate;
}
