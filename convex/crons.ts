import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "delete old messages",
  { hourUTC: 4, minuteUTC: 0 },
  internal.messages.deleteOldMessages,
);

export default crons;
