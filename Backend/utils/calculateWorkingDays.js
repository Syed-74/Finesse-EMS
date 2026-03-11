export const calculateWorkingDays = (month, year, holidays = [], weeklyOff = ["SUNDAY"]) => {
    const totalDays = new Date(year, month, 0).getDate();
    const daysMap = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

    let workingDays = 0;

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        const dayName = daysMap[date.getDay()];

        const isWeekend = weeklyOff.includes(dayName);

        const isHoliday = holidays.some((h) => {
            const hDate = new Date(h.holidayDate || h);
            hDate.setHours(0, 0, 0, 0);
            return hDate.getTime() === date.getTime();
        });

        if (!isWeekend && !isHoliday) {
            workingDays++;
        }
    }

    return workingDays;
};