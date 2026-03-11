export const calculateLeaveDays = (startDate, endDate, holidays, isHalfDay = false) => {

  let start = new Date(startDate);
  let end = new Date(endDate);

  let totalDays = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {

    const day = d.getDay();
    const isWeekend = (day === 0 || day === 6);

    const isHoliday = holidays.some(h =>
      new Date(h.holidayDate).toDateString() === d.toDateString()
    );

    if (!isWeekend && !isHoliday) {
      totalDays++;
    }

  }

  // If it's a half day and totalDays is 1 (same day), return 0.5
  if (isHalfDay && totalDays === 1) {
    return 0.5;
  }

  return totalDays;

};