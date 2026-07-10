
## BUILD DISCIPLINE (output hygiene — does not change the spec)

Your model has a 32000 output-token per-response cap. A single giant response that
contains the whole file plus long reasoning will overflow it and fail. So:

- Build the file in SMALL INCREMENTS. First create it with a Write containing a
  compact skeleton (imports-free root component + the `<style>` shell), then GROW it
  with successive Edit calls (one section per edit: date wheels, time wheels, wheel
  hook logic, styles). Never emit the entire file in one turn.
- Keep prose to a minimum. Do NOT restate or paste the file contents back into your
  message. Do NOT write long planning monologues. Point to what you changed in one
  line and move on.
- The finished artifact is identical to the spec above; only your working style
  changes to stay under the per-response token cap.
