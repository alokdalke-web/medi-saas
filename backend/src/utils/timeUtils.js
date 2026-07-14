/**
 * Parses a time string (e.g. "14:30", "2:30 PM", "09:00") into minutes since midnight.
 * @param {string} timeStr 
 * @returns {number|null}
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const str = timeStr.trim().toLowerCase();
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Checks if two time windows overlap.
 * @param {string} time1 Start time 1
 * @param {string} time2 Start time 2
 * @param {number} duration1 Duration 1 in minutes
 * @param {number} duration2 Duration 2 in minutes
 * @returns {boolean} True if they overlap
 */
const checkTimeOverlap = (time1, time2, duration1 = 30, duration2 = 30) => {
  const start1 = parseTimeToMinutes(time1);
  const start2 = parseTimeToMinutes(time2);
  
  if (start1 === null || start2 === null) return false;
  
  const end1 = start1 + duration1;
  const end2 = start2 + duration2;
  
  // Overlap condition: Start A < End B && End A > Start B
  return start1 < end2 && end1 > start2;
};

module.exports = {
  parseTimeToMinutes,
  checkTimeOverlap
};
