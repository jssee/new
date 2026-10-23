import { defineEvlog } from "evlog";

// Every evlog option lives here: sampling, enrich, route filters, and a drain
// when the project picks a log backend. Without one, events go to the console,
// which Vercel captures.
export default defineEvlog({
  service: "web",
});
