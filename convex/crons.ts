import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("delete old messages", { hours: 8 }, internal.messages.deleteOldMessages);

export default crons;
