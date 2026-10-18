import { confirm, prompt, runCli } from "./cli";
import { resetUserPassword } from "./operations";

await runCli(async () => {
  const email = await prompt("Account email: ");
  if (!(await confirm(`Reset the password and revoke all sessions for ${email}?`)))
    return;
  const result = await resetUserPassword(email);
  console.log(
    `Password reset completed. Record this temporary password now: ${result.password}`
  );
});
