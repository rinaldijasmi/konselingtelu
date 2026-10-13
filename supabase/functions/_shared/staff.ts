const passwordCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

export function generateTemporaryPassword() {
  const randomValues = crypto.getRandomValues(new Uint8Array(24));
  const requiredGroups = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%"];
  const password = requiredGroups.map((group, index) => group[randomValues[index] % group.length]);
  for (let index = requiredGroups.length; index < randomValues.length; index += 1) {
    password.push(passwordCharacters[randomValues[index] % passwordCharacters.length]);
  }
  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = randomValues[index] % (index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }
  return password.join("");
}

export function normalizeIndonesianPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (!digits || digits.startsWith("62")) return digits;
  return `62${digits}`;
}
