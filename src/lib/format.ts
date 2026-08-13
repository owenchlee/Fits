/** Strips everything but digits — for inputs like reps or seconds that must be whole numbers. */
export function sanitizeIntegerInput(value: string): string {
  return stripLeadingZeros(value.replace(/\D/g, ""));
}

/** Strips everything but digits and a single decimal point — for weight/measurement inputs. */
export function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  const deduped = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  return stripLeadingZeros(deduped);
}

/** "012" -> "12", "0" -> "0", "0.5" -> "0.5" — prevents a stuck leading zero in numeric text inputs. */
function stripLeadingZeros(value: string): string {
  return value.replace(/^0+(?=\d)/, "");
}

export function ordinalSuffix(n: number): string {
  const rounded = Math.round(n);
  const mod100 = rounded % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (rounded % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
