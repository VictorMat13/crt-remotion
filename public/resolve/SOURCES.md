# DaVinci Resolve 21.1 AI assistant (MCP) - sources and assets

Gathered 2026-10-13. Nothing here was rendered or executed. Downloaded files were treated as untrusted data.

## 1. Verified facts

| Fact | Verdict | Primary source |
|---|---|---|
| 21.1 adds AI assistant integration | VERIFIED | Blackmagic press release, https://www.blackmagicdesign.com/media/partial/release/20260908-03 |
| Announced Tuesday 8 Sept 2026 at IBC 2026, Amsterdam. "Available now" | VERIFIED | same press release (dateline "IBC 2026, Amsterdam, Netherlands - Tuesday, September 8, 2026"). CineD and YMCinema publish 9 Sept 2026 coverage, so use "Sept 8" |
| Works with "Claude, Claude Code and ChatGPT Codex" | VERIFIED | same press release |
| It is MCP: "the built-in MCP server" | VERIFIED | Resolve 21.1 Reference Manual p.4318 (PDF page 4318), https://documents.blackmagicdesign.com/UserManuals/DaVinci_Resolve_21.1_Reference_Manual.pdf . The press release itself never says "MCP"; the manual does. |
| Studio only (paid) | VERIFIED via manual, NOT stated in the press release | Manual p.4318: "DaVinci Resolve Studio supports integration with AI assistants like Claude Desktop and Claude Code." Corroborated by CineD ("The MCP server is Studio-only; Python scripting moved out of the free version into Studio"). The 21.1 download itself is free; the AI feature needs a Studio licence. Studio price not verified here. |
| What the AI can do (press release) | VERIFIED | "analyze projects, organize media, adjust settings and batch render using everyday conversational language ... create highlight edits from long form video, remove unwanted clips and render deliverables" |
| What the AI can do (manual) | VERIFIED | Manual p.4318: "organize timelines, create custom looks, create and run scripts, and have those actions reflected directly in DaVinci Resolve." Example prompts: render timeline as ProRes 422 HQ + H.265 4K + 1080p H.264 proxy; timeline breakdown (clip count, duration, offline media, markers); rename all clips on V1; colored markers per cut exported to CSV; "Apply the Sony SLog3 to Rec709 lut to node 2 of every clip"; check settings for Netflix delivery; diff project settings; "Reframe this timeline for 9:16 vertical." |
| Setup | VERIFIED | Manual: File > Setup AI Assistants. A dialog "AI Assistants Configured: The DaVinci Resolve MCP server has been added to these AI assistants" lists Claude Desktop, Claude Code, Codex in ChatGPT, Google Antigravity, Grok. Saved as shots/manual-p4318-ai-assistant-config-dialog.png |
| Security note | VERIFIED | Manual: "Any scripts created by the AI assistant share the same access permissions to disk, network and other resources as the AI assistant." |
| Also in 21.1 | VERIFIED | 20 new scripting APIs with built-in console support; 25+ Krokodove Fusion tools; 100+ new tools/controls; Photo page camera support (Fujifilm GFX/X, Leica SL, Sony A7R V1); multi-cam upgrades; per-format HDR trims. A new Preferences decode option lets you require full-resolution media for AI tools. |
| Subtitles via the AI | NOT FOUND in any primary source. Press release and manual never mention subtitles. The "Now add subtitles and a teaser version" quote appears only in a YMCinema stylized thumbnail (invented marketing copy). Do not claim subtitles. |
| Color grading / looks | PARTIAL: manual says "create custom looks" and LUT-to-node example. Press release says "adjust settings". No "color grade" wording. |

### Grant Petty quote (EXACT, found)
"With AI assistant support, our customers can now ask Claude or ChatGPT to handle repetitive tasks such as create highlight edits, organizing media or batch rendering, which frees them up to focus on creative decisions," said Grant Petty, Blackmagic Design CEO.
Source: Blackmagic press release https://www.blackmagicdesign.com/media/partial/release/20260908-03 . Also in the press release body: "so they can spend more time being creative rather than getting bogged down in repetitive tasks" (unattributed, not a Petty quote). Petty does not say "boring tasks"; the words are "repetitive tasks".

Secondary sources checked (consistent with the above): CineD https://www.cined.com/davinci-resolve-21-1-released-ai-assistant-integration-via-mcp-individual-hdr-trims-and-python-scripting-moves-to-studio/ ; YMCinema https://ymcinema.com/2026/09/09/davinci-resolve-21-1-chatgpt-claude-ai-assistants/ and https://ymcinema.com/2026/09/17/davinci-resolve-21-1-mcp-ai-assistants-control-edit/ .

## 2. Files

### shots/ (real Resolve UI, official Blackmagic)
| File | Source URL | Shows | Pixels |
|---|---|---|---|
| bmd-resolve21-Edit-hires.png | https://downloads.blackmagicdesign.com/press-releases/2026/20260908_b4494efe-f885-4aeb-8614-14d31a0442df/DaVinci-Resolve-21-Edit.zip (TIFF converted) | EDIT PAGE. Media pool bin thumbnails + inspector top, dual viewers (truck / cowboy shot), long multi-track timeline with orange/blue/green clips, "URSA Cine 17K - Ranch and Iceland Compile". Best timeline hero. | 5120x2880 |
| bmd-resolve21-Cut-hires.png | .../DaVinci-Resolve-21-Cut.zip | CUT PAGE. Multicam angle grid (6 cams) top right, dual timeline (upper full timeline, lower zoomed), "Destination Happiness EP24", mixer. | 3840x2160 |
| bmd-resolve21-Color-hires.png | .../DaVinci-Resolve-21-Color.zip | COLOR PAGE. Gallery stills left, cowboy viewer, node graph (labelled nodes JDT/INR/BEAUTY/EXP/CON/WB/SAT...), filmstrip, HDR Color Wheels, ColorSlice, Parade scope. Best nodes + wheels shot. | 3840x2160 |
| bmd-resolve21-Fusion-hires.png | .../DaVinci-Resolve-21-Fusion.zip | FUSION PAGE. "Documentary Channel" title, Effects list (Krokodove), node graph, text inspector. | 3840x2160 |
| bmd-resolve21-Fairlight-hires.png | .../DaVinci-Resolve-21-Fairlight.zip | FAIRLIGHT PAGE. Live Band demo, EQ window, green waveforms, mixer. | 3840x2160 |
| bmd-resolve21-Photo-hires.png | .../DaVinci-Resolve-21-Photo.zip | PHOTO PAGE. Contact sheet, red-dress fashion photo, histogram, filmstrip. | 3840x2160 |
| bmd-21-1-press-1.jpg | https://images.blackmagicdesign.com/images/media/releases/2026/20260908_davinci-resolve-21-1/carousel/1-davinci-resolve-21-1.jpg | Stylized marketing art (smiling woman, color wheels, node graph, timeline). Not UI. | 1000x547 |
| bmd-21-1-press-2..7.jpg | same path, /carousel/N-davinci-resolve-21-1.jpg | Low-res (1000px) previews of Photo, Edit, Cut multicam, Color, Fusion, Fairlight. Prefer the hires TIFF versions above. | 1000x547 |
| bmd-product-media-media-xl.jpg | https://images.blackmagicdesign.com/images/products/davinciresolve/overview/media/media-xl.jpg | MEDIA PAGE (product page). Bin tree, clip grid, viewer, metadata. | 998x567 |
| bmd-product-edit-edit-xl.jpg | .../overview/edit/edit-xl.jpg | Edit page, product-page crop | 1000x500 |
| bmd-product-cut-cut-xl.jpg | .../overview/cut/cut-xl.jpg | Cut page, product-page crop | 1000x600 |
| bmd-product-color-color-xl.jpg | .../overview/color/color-xl.jpg | Color page, product-page crop | 1000x560 |
| bmd-product-fairlight-fairlight-xl.jpg | .../overview/fairlight/fairlight-xl.jpg | Fairlight, product-page crop | 1000x545 |
| bmd-product-neuralengine-neuralengine-xl.jpg | .../overview/neuralengine/neuralengine-xl.jpg | Neural Engine marketing art (check before use) | 2000x840 |
| bmd-product-whatsnew-whatsnew-xl.jpg | .../overview/whatsnew/whatsnew-xl.jpg | "What's new" collage banner (check before use) | 2880x1124 |
| bmd-product-color-ui-node.jpg, bmd-product-cut-ui-smart.jpg, bmd-product-media-ui-smart.jpg, bmd-product-media-ui-render.jpg | .../overview/{color/ui-node,cut/ui-smart,media/ui-smart,media/ui-render}.jpg | Small inset UI crops, too small for hero use | 354x456 / 177x228 |

Manual figures (extracted from the official Reference Manual PDF, PDF page in brackets). Lower res, but real UI:
| File | Source | Shows | Pixels |
|---|---|---|---|
| manual-p4318-ai-assistant-config-dialog.png | Reference Manual PDF p.4318 | The real "AI Assistants Configured" dialog with Resolve icon; list: Claude Desktop (extension installer opened), Claude Code, Codex in ChatGPT, Google Antigravity, Grok; OK button. BEST proof shot. | 538x326 |
| manual-media-page.png | Manual p.343 | MEDIA PAGE. Bin list left, clip thumbnails grid, viewer with woman, lower clip grid + metadata. | 1034x569 |
| manual-color-page.png | Manual p.3046 | COLOR PAGE full layout: gallery, viewer, node graph, primaries wheels, curves, parade scope. | 1032x569 |
| manual-color-nodes-a.png | Manual p.3385 | Color page, full-width node graph panel with node thumbnails (Clip nodes mode). Large clean node close-up (wide). | 1034x587 |
| manual-color-nodes-b.png | Manual p.3385 | Node editor close-up crop | 1034x446 |
| manual-color-p3047.png | Manual p.3047 | Color page crop | 1034x307 |
| manual-deliver-a.png | Manual p.4095 | QUICK EXPORT dialog (icon grid): H.264 Master, HyperDeck, H.265 Master, ProRes 422 HQ, YouTube, Vimeo, TikTok, Presentations, Dropbox, Replay, ProRes4444XQ. Not the full Deliver page. | 951x572 |
| manual-deliver-b.png | Manual p.4096 | Quick Export, list view of same presets. | 951x572 |
| manual-deliver-render-settings.png | Manual p.4104 | DELIVER page Render Settings panel with preset dropdown open (Custom Export, H.264/H.265/ProRes, YouTube 1080p with 720p/1080p/1440p/2160p submenu, TikTok, Vimeo, IMF, Final Cut, Premiere XML, Pro Tools, Vision Pro, Meta Quest). Narrow crop. | 591x974 |

No full-resolution Deliver page screenshot exists on Blackmagic's product page or press kit (press kit has only Edit, Cut, Color, Fusion, Fairlight, Photo). Use the render-settings panel crop or Quick Export dialog.

shots/_do-not-use/ : YMCinema thumbnails (ymc-*.webp, 1920x1080). They are AI-stylized graphics with redrawn OpenAI/Claude/MCP badges and invented quotes. Do NOT use; kept only for reference.

### frames/ (third-party YouTube screen recordings, NOT Blackmagic)
Downloaded with yt-dlp (1080p) and extracted with ffmpeg. All 1920x1080 JPG. Rights belong to the uploaders; get permission or use only as reference. Neither video is embedded in the CineD/YMCinema articles; found by search. Blackmagic published no official demo video that I could find.
| Folder | Source | Interval | Notable frames |
|---|---|---|---|
| frames/team2-yRxmdTUh7GU/ (114 frames, f_001..f_114, every 10s) | https://www.youtube.com/watch?v=yRxmdTUh7GU "DaVinci Resolve 21.1 BEST New Feature TESTED - AI Editing with Claude and ChatGPT" (Team 2 Films, 1139s) | 1/10 s | f_001 title card "Resolve 21.1 - AI Agent MCP Integration / Works with DaVinci Resolve Studio" with Resolve icon (uploader graphic); f_061, f_069, f_073 Claude chat prompts ("Natalie returns!", "extract vertical shorts ... 60 seconds long"); f_077 Resolve edit page showing generated timelines; f_081 prompt about caching an Arri timeline; f_085 Resolve Color page with Claude panel and wheels/scopes; f_041, f_045 Resolve Media/Cut page being driven. Chat client is Claude desktop (Cowork, Sonnet). Many frames are a presenter talking head. |
| frames/andre-xDIWP9pCGK4/ (169 frames, f_001..f_169, every 2s) | https://www.youtube.com/watch?v=xDIWP9pCGK4 "NEW DaVinci Resolve 21.1 Just Put Claude Inside Your Timeline" (Andre Morgan Photography, 338s) | 1/2 s | f_013 the real "What's in DaVinci Resolve 21.1" welcome dialog (AI Assistant Control listed first); f_025-f_045 Resolve Studio with Claude Desktop chat window beside it; f_103-f_115 Resolve Fusion page with Claude chat overlay, then "Flicker" text title built by the AI. Corner has a presenter bubble. |

### logos/
| File | Source URL | What it is | Notes |
|---|---|---|---|
| claude.svg | copied from public/artcraft/logos/claude.svg | Claude spark mark, fill #D97757 | self-contained, single path |
| davinci-resolve-icon.svg | https://commons.wikimedia.org/wiki/File:DaVinci_Resolve_17_logo.svg (https://upload.wikimedia.org/wikipedia/commons/9/90/DaVinci_Resolve_17_logo.svg) | DaVinci Resolve app icon (three-circle mark in rounded square) | 65x65 viewBox, 148 KB, no external refs, has Inkscape metadata. Commons: public domain (trademarked). Same icon design appears in Resolve 21 dialogs. |
| davinci-resolve-19-logo-wordmark.png | https://commons.wikimedia.org/wiki/File:Logo_of_DaVinci_Resolve_19.png | Icon + "DaVinci Resolve" wordmark | 236x50 only, too small for hero; use SVG icon |
| blackmagic-design-logo-official.svg | https://images.blackmagicdesign.com/images/common/logos/gn-logo.svg (Blackmagic site header logo) | Official Blackmagic Design logo (colored squares + wordmark) | 150x52 viewBox, 20 KB, self-contained. Not visually inspected (SVG); wordmark color may be tuned for light/dark header, check on dark background. |
| blackmagic-design-logo-commons.png | https://commons.wikimedia.org/wiki/File:Blackmagic_Design_logo.png | Blackmagic Design logo raster | 1280x607 |
| openai-symbol.svg | https://commons.wikimedia.org/wiki/File:OpenAI_logo_2025_(symbol).svg | OpenAI blossom symbol | 512x507, self-contained (no image/href/script) |
| chatgpt-logo.svg | https://commons.wikimedia.org/wiki/File:ChatGPT-Logo.svg | ChatGPT mark | 512x512, self-contained |

SVG self-containment check: grep for href/src/<image/@import/<script/url(http found nothing in any SVG.

## 3. Not found / caveats
- No explicit "Studio only" sentence in Blackmagic's press release; it comes from the Reference Manual (and CineD). The AI feature needs Studio; the 21.1 build itself is free.
- Subtitles: no primary-source support.
- Petty never says "boring"; use "repetitive tasks" and "focus on creative decisions".
- X posts (x.com/Blackmagic_News/..., x.com/EHuanglu/...): WebFetch returned HTTP 402; skipped.
- No full Deliver page screenshot; no official Blackmagic video of MCP in action. Only third-party YouTube recordings.
- Manual lists Claude Desktop, Claude Code, Codex in ChatGPT, Google Antigravity, Grok as detected; press release names only Claude, Claude Code, ChatGPT Codex.
- Media page: product-page and manual shots only (up to 1034px wide).
