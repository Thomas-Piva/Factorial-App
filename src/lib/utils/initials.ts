function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getInitials(firstName: string, lastName: string): string {
  const first = stripAccents(firstName.trim())[0] ?? "";
  const last = stripAccents(lastName.trim())[0] ?? "";
  return (first + last).toUpperCase();
}

export function getDisplayName(
  firstName: string,
  preferredName: string | null,
): string {
  return preferredName?.trim() || firstName;
}
