/**
 * Calculate the deadline for picks submission
 * Deadline is Thursday at 12:00 PM Pacific Time for each week
 */
export function getWeekDeadline(weekGames: { game_time: string }[]): Date {
  if (!weekGames || weekGames.length === 0) {
    return new Date();
  }

  // Get the first game of the week
  const firstGameTime = new Date(weekGames[0].game_time);
  
  // Find the Thursday before the first game at 12pm Pacific
  const thursday = new Date(firstGameTime);
  
  // Go back to find Thursday (4 = Thursday, 0 = Sunday)
  const dayOfWeek = firstGameTime.getDay(); // 0-6 (Sun-Sat)
  
  // Calculate days to go back to reach Thursday
  // If first game is on Thursday (4), use that Thursday
  // If first game is Fri-Sat (5-6), use the Thursday of that week
  // If first game is Sun-Wed (0-3), use the previous Thursday
  let daysToGoBack = 0;
  if (dayOfWeek === 4) {
    // Game is on Thursday
    daysToGoBack = 0;
  } else if (dayOfWeek === 5 || dayOfWeek === 6) {
    // Game is Fri or Sat, go back to Thursday of same week
    daysToGoBack = dayOfWeek - 4;
  } else {
    // Game is Sun-Wed, go back to previous Thursday
    daysToGoBack = dayOfWeek + 3; // Sun=3, Mon=4, Tue=5, Wed=6
  }
  
  thursday.setDate(thursday.getDate() - daysToGoBack);
  
  // Set to 12:00 PM Pacific Time
  // We'll set it in UTC and let the browser handle timezone conversion
  // 12pm Pacific = 8pm UTC (during DST) or 9pm UTC (during standard time)
  const year = thursday.getFullYear();
  const month = thursday.getMonth();
  const day = thursday.getDate();
  
  // Create a date string for 12pm Pacific on that Thursday
  const pacificDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`;
  
  // Parse as Pacific time
  const deadline = new Date(pacificDateString + '-07:00'); // Pacific is UTC-7 during DST, UTC-8 otherwise
  
  return deadline;
}

/**
 * Check if current time is past the deadline
 * @param deadline The deadline Date object
 * @returns true if past deadline, false otherwise
 */
export function isPastDeadline(deadline: Date): boolean {
  const now = new Date();
  return now >= deadline;
}

/**
 * Get a user-friendly deadline string
 */
export function formatDeadline(deadline: Date): string {
  return deadline.toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short',
  });
}
