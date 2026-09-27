/** Text handoff to LinkedIn's web composer. Only text is transferred.
 * LinkedIn may drop the parameters across sign-in, so callers also offer copy.
 */
export function linkedinComposerUrl(text: string): string {
  const url = new URL("https://www.linkedin.com/feed/");
  url.searchParams.set("shareActive", "true");
  url.searchParams.set("text", text);
  return url.toString();
}
