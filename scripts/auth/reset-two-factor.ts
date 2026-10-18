import { confirm, prompt, runCli } from "./cli";
import { resetUserTwoFactor } from "./operations";

await runCli(async () => {
  const email = await prompt("Account email: ");
  if (
    !(await confirm(
      `Reset two-factor authentication and revoke all sessions for ${email}?`
    ))
  )
    return;
  await resetUserTwoFactor(email);
  console.log(
    "Two-factor authentication has been reset. The user must change their password and enroll again."
  );
});
