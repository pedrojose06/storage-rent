export type MonthlyRentRecord = {
  vacancy: boolean
  rentAmount: number
  rentDueDate: Date
}

export type MonthlyRentRecords = Array<MonthlyRentRecord>

export type Contract = {
  baseMonthlyRent: number
  leaseStartDate: Date
  windowStartDate: Date
  windowEndDate: Date
  dayOfMonthRentDue: number
  rentRateChangeFrequency: number
  rentChangeRate: number
}

/**
 * Determines the vacancy, rent amount and due date for each month in a given time window
 *
 * @param baseMonthlyRent : The base or starting monthly rent for unit (Number)
 * @param leaseStartDate : The date that the tenant's lease starts (Date)
 * @param windowStartDate : The first date of the given time window (Date)
 * @param windowEndDate : The last date of the given time window (Date)
 * @param dayOfMonthRentDue : The day of each month on which rent is due (Number)
 * @param rentRateChangeFrequency : The frequency in months the rent is changed (Number)
 * @param rentChangeRate : The rate to increase or decrease rent, input as decimal (not %), positive for increase, negative for decrease (Number),
 * @returns Array<MonthlyRentRecord>;
 */

export function calculateMonthlyRent(contract: Contract): MonthlyRentRecords {
  const {
    dayOfMonthRentDue,
    windowEndDate,
    baseMonthlyRent,
    leaseStartDate,
    rentChangeRate,
    rentRateChangeFrequency,
  } = contract

  const firstMonthRent = calculateFirstMonthRent(
    dayOfMonthRentDue,
    leaseStartDate,
    baseMonthlyRent,
    rentChangeRate
  )
  const monthlyRentRecords = [] as MonthlyRentRecords

  firstMonthRent && monthlyRentRecords.push(...firstMonthRent)
  for (
    let month =
      monthlyRentRecords[monthlyRentRecords.length - 1].rentDueDate.getMonth();
    month <=
    calculateMonthDifference(
      windowEndDate,
      monthlyRentRecords[monthlyRentRecords.length - 1].rentDueDate
    );
    month++
  ) {
    const rentDueDate = correctRentDueDate(
      leaseStartDate.getFullYear(),
      monthlyRentRecords[monthlyRentRecords.length - 1].rentDueDate.getMonth() +
        1,
      dayOfMonthRentDue
    )

    const rentAmount =
      month % rentRateChangeFrequency === 0
        ? roundToTwoDecimalPlaces(
            calculateNewMonthlyRent(
              monthlyRentRecords[monthlyRentRecords.length - 1].rentAmount,
              rentChangeRate
            )
          )
        : roundToTwoDecimalPlaces(monthlyRentRecords[month].rentAmount)

    monthlyRentRecords.push({
      vacancy: isVacant(rentChangeRate),
      rentAmount: rentAmount,
      rentDueDate: rentDueDate,
    })
  }

  return monthlyRentRecords
}

/**
 * Calculates the new monthly rent
 *
 * @param baseMonthlyRent : the base amount of rent
 * @param rentChangeRate : the rate that rent my increase or decrease (positive for increase, negative for decrease)
 * @returns number
 *
 */
function calculateNewMonthlyRent(
  baseMonthlyRent: number,
  rentChangeRate: number
) {
  return baseMonthlyRent * (1 + rentChangeRate)
}

/**
 * Determines if the year is a leap year
 *
 * @param year
 * @returns boolean
 *
 */
function isLeapYear(year: number) {
  return year % 4 === 0 && year % 100 !== 0
}

/**
 * Rounds a number to two decimal places
 *
 * @param value : the number to be rounded
 * @returns number
 *
 */
function roundToTwoDecimalPlaces(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Calculate the difference in months between two dates
 *
 * @param windowStartDate : The first date of the given time window
 * @param windowEndDate : The last date of the given time window
 * @returns number
 *
 */
function calculateMonthDifference(windowEndDate, windowStartDate): number {
  if (windowStartDate.getFullYear() > windowEndDate.getFullYear()) return -1

  if (windowStartDate.getFullYear() === windowEndDate.getFullYear()) {
    return windowEndDate.getMonth() - windowStartDate.getMonth()
  }

  const countMonthsInYear =
    (windowEndDate.getFullYear() - windowStartDate.getFullYear() - 1) * 12

  if (windowStartDate.getMonth() > windowEndDate.getMonth()) {
    return (
      windowStartDate.getMonth() - windowEndDate.getMonth() + countMonthsInYear
    )
  }

  return (
    windowEndDate.getMonth() - windowStartDate.getMonth() + countMonthsInYear
  )
}

function isVacant(rentChangeRate: number) {
  return rentChangeRate < 0
}

/**
 * Calculate the First Month Rent based on the day of the month rent is due
 *
 * @param dayOfMonthRentDue : The day of each month on which rent is due
 * @param leaseStartDate : The date that the tenant's lease starts
 * @param baseMonthlyRent : The base or starting monthly rent for unit
 * @returns Array<MonthlyRentRecord>;
 *
 */
function calculateFirstMonthRent(
  dayOfMonthRentDue: number,
  leaseStartDate: Date,
  baseMonthlyRent: number,
  rentChangeRate: number
) {
  if (dayOfMonthRentDue === leaseStartDate.getDate()) {
    return [
      {
        vacancy: isVacant(rentChangeRate),
        rentAmount: baseMonthlyRent,
        rentDueDate: correctRentDueDate(
          leaseStartDate.getFullYear(),
          leaseStartDate.getMonth(),
          dayOfMonthRentDue
        ),
      },
    ] as MonthlyRentRecords
  }
  const isLeaseStartDateAfterDueDate = Number(
    dayOfMonthRentDue < leaseStartDate.getDate()
  ) //false

  const calcRent = roundToTwoDecimalPlaces(
    baseMonthlyRent *
      (isLeaseStartDateAfterDueDate -
        (dayOfMonthRentDue - leaseStartDate.getDate()) / 30) *
      (isLeaseStartDateAfterDueDate ? 1 : -1)
  )

  if (isLeaseStartDateAfterDueDate)
    return [
      {
        vacancy: isVacant(rentChangeRate),
        rentAmount: calcRent,
        rentDueDate: correctRentDueDate(
          leaseStartDate.getFullYear(),
          leaseStartDate.getMonth(),
          dayOfMonthRentDue
        ),
      },
    ] as MonthlyRentRecords

  return [
    {
      vacancy: isVacant(rentChangeRate),
      rentAmount: calcRent,
      rentDueDate: leaseStartDate,
    },
    {
      vacancy: isVacant(rentChangeRate),
      rentAmount: baseMonthlyRent,
      rentDueDate: correctRentDueDate(
        leaseStartDate.getFullYear(),
        leaseStartDate.getMonth(),
        dayOfMonthRentDue
      ),
    },
  ] as MonthlyRentRecords
}

/**
 * Gets the number of days in a month
 *
 * @param year : The year
 * @param month : The month (0-11)
 * @returns number
 *
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Correct the Rent Due Date based on the day of the month rent is due
 *
 * @param leaseStartDate : The date that the tenant's lease starts
 * @param dayOfMonthRentDue : The day of each month on which rent is due
 * @returns Date
 *
 */
function correctRentDueDate(
  year: number,
  month: number,
  dayOfMonthRentDue: number
): Date {
  let daysInMonth: number
  if (month === 1 && dayOfMonthRentDue > 28) {
    daysInMonth = isLeapYear(year) ? 29 : 28
  }
  daysInMonth = getDaysInMonth(year, month)
  const dueDate =
    dayOfMonthRentDue > daysInMonth
      ? new Date(year, month, daysInMonth)
      : new Date(year, month, dayOfMonthRentDue)

  return dueDate
}
