# Autoplay failure triage

27 October 2026 AEDT. Changes under verification, not yet released.

HUD ResizeObserver schedules coalesced layout writes in the next animation frame and cancels pending work on destruction. Autoplay reuses the reporter's exact two browser delivery-notice classifications; actual exceptions and rejected promises remain failures.

Autoplay previously enumerated Studio-disabled fruit games and then reported their correct refusal as failed launches. Step selection and execution now respect the same availability predicates as game launch; enabled games still must open their own matching game window. Fruit Bar planner uses visible solo/counter/ready/next controls in its separate modal.

Still pending: enabled and disabled browser fixtures, actual autoplay completion, unsupported older games/quest paths, and independent checks of genuine enabled-launch failures. Do not label all existing reports as false positives.
