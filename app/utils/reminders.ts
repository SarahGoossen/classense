export function calculateReminderTime(
  input: string,
  offset: string
): Date {
  try {
    const base = new Date(input);

    // 🛑 if base date is invalid → fallback safely
    if (isNaN(base.getTime())) {
      console.warn("Invalid base date:", input);
      return new Date(); // fallback to now (prevents crash)
    }

    const result = new Date(base);

    switch (offset) {
      case "1w":
        result.setDate(result.getDate() - 7);
        break;

      case "2d":
        result.setDate(result.getDate() - 2);
        break;

      case "1d":
        result.setDate(result.getDate() - 1);
        break;

      case "12h":
        result.setHours(result.getHours() - 12);
        break;

      case "2h":
        result.setHours(result.getHours() - 2);
        break;

      default:
        // fallback: no offset
        break;
    }

    // 🛑 FINAL safety check
    if (isNaN(result.getTime())) {
      console.warn("Invalid reminder result");
      return new Date();
    }

    return result;
  } catch (err) {
    console.warn("Reminder calculation failed:", err);
    return new Date();
  }
}