import { defineParams } from "@sveltejs/kit/params";
import { picklist } from "valibot";

export const params = defineParams({
  authtype: picklist(["sign-in", "sign-up"]),
});
