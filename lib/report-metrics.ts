import { GoogleReview } from "@/types/shop";

export type DateRangeFilter = "today" | "7d" | "30d" | "custom";
export type StarRatingFilter = "all" | "5" | "4" | "3" | "2" | "1";

export interface PeriodComparison {
  currentCount: number;
  previousCount: number;
  diff: number;
  percentageChange: number | null; // null if previous was 0
}

export interface RatingMetrics {
  averageRating: number;
  previousAverageRating: number | null;
  ratingDiff: number | null;
  totalCount: number;
  starCounts: Record<number, number>;
}

export interface ReportMetricsSummary {
  daily: PeriodComparison;
  weekly: PeriodComparison;
  monthly: PeriodComparison;
  ratingMetrics: RatingMetrics;
  filteredReviews: GoogleReview[];
}

/**
 * Extract date components in target timezone
 */
export function getTimezoneDateParts(date: Date, timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value || 0);

    return {
      year: getPart("year"),
      month: getPart("month"),
      day: getPart("day"),
      hour: getPart("hour"),
      minute: getPart("minute"),
      second: getPart("second"),
    };
  } catch {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
    };
  }
}

/**
 * Format timestamp in restaurant's timezone
 */
export function formatInTimezone(dateStr: string, timeZone: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Calculate equal-length period comparisons and filtered reviews
 */
export function computeReportMetrics(
  reviews: GoogleReview[],
  timeZone: string = "Asia/Kolkata",
  dateFilter: DateRangeFilter = "30d",
  starFilter: StarRatingFilter = "all",
  customStart?: string,
  customEnd?: string,
  referenceNow: Date = new Date()
): ReportMetricsSummary {
  const nowMs = referenceNow.getTime();

  // 1. Daily: Today so far vs Yesterday so far in restaurant's timezone
  const tzParts = getTimezoneDateParts(referenceNow, timeZone);
  const msElapsedToday =
    (tzParts.hour * 3600 + tzParts.minute * 60 + tzParts.second) * 1000;

  const todayStartMs = nowMs - msElapsedToday;
  const todayEndMs = nowMs;

  const yesterdayStartMs = todayStartMs - 24 * 3600 * 1000;
  const yesterdayEndMs = yesterdayStartMs + msElapsedToday;

  const todayCount = reviews.filter((r) => {
    const t = new Date(r.postedAt).getTime();
    return t >= todayStartMs && t <= todayEndMs;
  }).length;

  const yesterdayCount = reviews.filter((r) => {
    const t = new Date(r.postedAt).getTime();
    return t >= yesterdayStartMs && t <= yesterdayEndMs;
  }).length;

  const dailyDiff = todayCount - yesterdayCount;
  const dailyPct =
    yesterdayCount > 0
      ? Math.round((dailyDiff / yesterdayCount) * 100)
      : todayCount > 0
      ? 100
      : 0;

  // 2. Weekly: Last 7 days vs Previous 7 days
  const sevenDaysMs = 7 * 24 * 3600 * 1000;
  const weekCurrentStart = nowMs - sevenDaysMs;
  const weekPrevStart = nowMs - 2 * sevenDaysMs;

  const weekCurrentCount = reviews.filter((r) => {
    const t = new Date(r.postedAt).getTime();
    return t >= weekCurrentStart && t <= nowMs;
  }).length;

  const weekPrevCount = reviews.filter((r) => {
    const t = new Date(r.postedAt).getTime();
    return t >= weekPrevStart && t < weekCurrentStart;
  }).length;

  const weekDiff = weekCurrentCount - weekPrevCount;
  const weekPct =
    weekPrevCount > 0
      ? Math.round((weekDiff / weekPrevCount) * 100)
      : weekCurrentCount > 0
      ? 100
      : 0;

  // 3. Monthly: Last 30 days vs Previous 30 days
  const thirtyDaysMs = 30 * 24 * 3600 * 1000;
  const monthCurrentStart = nowMs - thirtyDaysMs;
  const monthPrevStart = nowMs - 2 * thirtyDaysMs;

  const monthCurrentCount = reviews.filter((r) => {
    const t = new Date(r.postedAt).getTime();
    return t >= monthCurrentStart && t <= nowMs;
  }).length;

  const monthPrevCount = reviews.filter((r) => {
    const t = new Date(r.postedAt).getTime();
    return t >= monthPrevStart && t < monthCurrentStart;
  }).length;

  const monthDiff = monthCurrentCount - monthPrevCount;
  const monthPct =
    monthPrevCount > 0
      ? Math.round((monthDiff / monthPrevCount) * 100)
      : monthCurrentCount > 0
      ? 100
      : 0;

  // 4. Filtering by Date Range
  let rangeStartMs = monthCurrentStart;
  let rangeEndMs = nowMs;

  if (dateFilter === "today") {
    rangeStartMs = todayStartMs;
    rangeEndMs = todayEndMs;
  } else if (dateFilter === "7d") {
    rangeStartMs = weekCurrentStart;
    rangeEndMs = nowMs;
  } else if (dateFilter === "30d") {
    rangeStartMs = monthCurrentStart;
    rangeEndMs = nowMs;
  } else if (dateFilter === "custom") {
    if (customStart) {
      const parsedStart = new Date(`${customStart}T00:00:00`);
      rangeStartMs = isNaN(parsedStart.getTime()) ? 0 : parsedStart.getTime();
    } else {
      rangeStartMs = 0;
    }
    if (customEnd) {
      const parsedEnd = new Date(`${customEnd}T23:59:59`);
      rangeEndMs = isNaN(parsedEnd.getTime()) ? nowMs : parsedEnd.getTime();
    } else {
      rangeEndMs = nowMs;
    }
  }

  // Filter reviews by date window
  const reviewsInDateRange = reviews.filter((r) => {
    const t = new Date(r.postedAt).getTime();
    return t >= rangeStartMs && t <= rangeEndMs;
  });

  // Calculate prior equal-length window for trend in the selected filter
  const windowLengthMs = Math.max(1000, rangeEndMs - rangeStartMs);
  const priorWindowStartMs = rangeStartMs - windowLengthMs;
  const priorWindowEndMs = rangeStartMs;

  const priorWindowReviews = reviews.filter((r) => {
    const t = new Date(r.postedAt).getTime();
    return t >= priorWindowStartMs && t < priorWindowEndMs;
  });

  // Rating metrics in current filtered period
  const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let starSum = 0;

  reviewsInDateRange.forEach((r) => {
    const s = Math.min(5, Math.max(1, Math.round(r.stars || 5)));
    starCounts[s] = (starCounts[s] || 0) + 1;
    starSum += s;
  });

  const averageRating =
    reviewsInDateRange.length > 0
      ? Number((starSum / reviewsInDateRange.length).toFixed(1))
      : 0;

  let priorAverage: number | null = null;
  let ratingDiff: number | null = null;

  if (priorWindowReviews.length > 0) {
    const priorSum = priorWindowReviews.reduce((sum, r) => sum + (r.stars || 5), 0);
    priorAverage = Number((priorSum / priorWindowReviews.length).toFixed(1));
    ratingDiff = Number((averageRating - priorAverage).toFixed(1));
  }

  // 5. Star Filter
  let filteredReviews = reviewsInDateRange;
  if (starFilter !== "all") {
    const targetStar = Number(starFilter);
    filteredReviews = reviewsInDateRange.filter((r) => Math.round(r.stars) === targetStar);
  }

  // Sort newest first
  filteredReviews.sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );

  return {
    daily: {
      currentCount: todayCount,
      previousCount: yesterdayCount,
      diff: dailyDiff,
      percentageChange: dailyPct,
    },
    weekly: {
      currentCount: weekCurrentCount,
      previousCount: weekPrevCount,
      diff: weekDiff,
      percentageChange: weekPct,
    },
    monthly: {
      currentCount: monthCurrentCount,
      previousCount: monthPrevCount,
      diff: monthDiff,
      percentageChange: monthPct,
    },
    ratingMetrics: {
      averageRating,
      previousAverageRating: priorAverage,
      ratingDiff,
      totalCount: reviewsInDateRange.length,
      starCounts,
    },
    filteredReviews,
  };
}
