# Remotion Prompt Bank

## Prompt: Screen-recording walkthrough series (reuse an existing creator theme)

Use when a creator's sponsored script needs Remotion graphics that look like a live screen recording of an AI agent using the product.

Fill in the `[BRACKETS]` before sending.

---

**[CREATOR] x [PRODUCT]: Remotion graphics series**

Build the Remotion graphics for [CREATOR]'s [PRODUCT] script. Use the Liam Remotion graphics pipeline as usual, with one change to the look.

**1. Theme: reuse an existing series look**
- Don't use the default Liam palette. Match [CREATOR]'s [REFERENCE SERIES] exactly: same background, colors, type, card styling and terminal look.
- Pull the tokens straight from the existing source (`[REFERENCE SOURCE FOLDER, e.g. src/xxx]`) so the palette isn't approximated.
- Start the [PRODUCT] theme file as a copy of that theme. Only the [PRODUCT] brand assets and logo should be new.

**2. Reference capture: walk through [PRODUCT] yourself**
- Open [PRODUCT] in Playwright and do the real workflow from the script, one step at a time.
- Take a screenshot at every meaningful state: the empty prompt box, the prompt being typed, generation in progress, the first result, each edit being requested, and each edit applied.
- Save them in order with numbered names (`01-prompt-empty.png`, `02-prompt-typed.png`, and so on) so they read as a storyboard.
- Use the real UI and the official [PRODUCT] logo. Nothing mocked from memory.

**3. Motion: it has to feel like a screen recording**
- Build each part so it looks like [AGENT, e.g. GPT-6 Astra] is driving the computer live: the cursor moves to the input, the prompt types out character by character, buttons get clicked, the result generates, then the agent prompts edits one at a time and each change shows up in the UI.
- Follow the screenshots step by step. No jumping straight to the finished result.
- Keep the camera tight and following the action, as if someone is recording their screen. Use cuts and moves only where a real recording would have them.

**4. Delivery**
- Split the work per script part with the aspect ratios the script specifies. Use parallel builders (Opus) as usual.
- Verify each render against the reference screenshots before delivering.
- Name each file after the opening words of its script line.

**Inputs to include**
- Script location: [NOTION PAGE OR FILE PATH], plus the part and aspect-ratio breakdown if the script doesn't have it.
- Login: [ACCOUNT TO USE], and whether spending generation credits during the capture is OK.
