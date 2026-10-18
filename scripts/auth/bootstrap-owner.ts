import { confirm, prompt, runCli } from "./cli";
import { bootstrapOwner } from "./operations";

await runCli(async () => {
  const email = await prompt("Owner email: ");
  const name = await prompt("Owner name: ");
  if (!(await confirm(`Create the initial owner account for ${email}?`))) return;
  const result = await bootstrapOwner({ email, name });
  console.log(
    `Owner created for ${result.user.email}. Record this temporary password now: ${result.password}`
  );
});
