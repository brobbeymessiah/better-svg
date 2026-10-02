let copiedText = new WeakMap<HTMLButtonElement, string>();
const pending = new WeakSet<HTMLButtonElement>();
const resets = new Map<HTMLButtonElement, number>();

document.addEventListener("astro:before-swap", () => {
  for (const timer of resets.values()) window.clearTimeout(timer);
  resets.clear();
  copiedText = new WeakMap();
});

export async function copyToClipboard(
  button: HTMLButtonElement,
  text: string,
  onResult: (copied: boolean) => void,
  onReset?: () => void,
) {
  if (pending.has(button)) return;
  let copied = copiedText.get(button) === text;
  if (!copied) {
    pending.add(button);
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = false;
    } finally {
      pending.delete(button);
    }
  }
  if (!button.isConnected) return;
  if (copied) copiedText.set(button, text);
  onResult(copied);
  window.clearTimeout(resets.get(button));
  resets.set(
    button,
    window.setTimeout(() => {
      resets.delete(button);
      copiedText.delete(button);
      onReset?.();
    }, 2000),
  );
}
