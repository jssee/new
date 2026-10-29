import { defineEvlog } from "evlog";

// Every evlog option (sampling, enrich, drain) lives here; hooks.server.ts
// hands it to both the logger and the request hooks. There is no drain until
// the project picks a backend, so events go to the console, which Vercel
// captures.
export default defineEvlog({ service: "myapp-web" });
