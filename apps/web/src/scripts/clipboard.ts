let lastCopy: { button: HTMLButtonElement; text: string } | undefined;
const pending = new WeakSet<HTMLButtonElement>();
const resets = new Map<HTMLButtonElement, number>();

document.addEventListener("astro:before-swap", () => {
  for (const timer of resets.values()) window.clearTimeout(timer);
  resets.clear();
  lastCopy = undefined;
});

export async function copyToClipboard(
  button: HTMLButtonElement,
  text: string,
  onResult: (copied: boolean) => void,
  onReset?: () => void,
) {
  if (pending.has(button)) return;
  let copied = lastCopy?.button === button && lastCopy.text === text;
  if (!copied) {
    lastCopy = undefined;
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
  if (copied) lastCopy = { button, text };
  onResult(copied);
  window.clearTimeout(resets.get(button));
  resets.set(
    button,
    window.setTimeout(() => {
      resets.delete(button);
      if (lastCopy?.button === button) lastCopy = undefined;
      onReset?.();
    }, 2000),
  );
}
