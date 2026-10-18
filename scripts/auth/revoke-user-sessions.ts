import { confirm, prompt, runCli } from "./cli";
import { revokeUserSessions } from "./operations";

await runCli(async () => {
  const email = await prompt("Account email: ");
  if (!(await confirm(`Revoke every active session for ${email}?`))) return;
  const result = await revokeUserSessions(email);
  console.log(`Revoked ${result.revoked} session(s).`);
});
