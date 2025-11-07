export type BlogEntry = {
  id: string;
  headline: string;
  title: string;
  description: string;
  date: string; // ISO string or "2024-05-12"
  content: string; // Markdown
  contentReference: string[];
};

export type BlogContentReference = string;

export const blogEntries: BlogEntry[] = [
  {
    id: "duet-night-abyss-launch",
    headline: "Duet Night Abyss Interactive Maps Now Live",
    title: "Duet Night Abyss Support: Interactive Maps & Activity Tracker",
    description:
      "Explore Duet Night Abyss with detailed interactive maps for all major regions, plus a new activity tracker to manage your daily and weekly goals. Companion app support coming soon!",
    date: "2025-11-07",
    content: `
**Duet Night Abyss** has officially joined the TH.GL lineup! 🎮

Whether you're a new player exploring the world or a veteran managing your daily routine, the new maps and activity tracker are here to help you get the most out of your journey.

## 🗺️ Interactive Maps for All Major Regions

Explore every corner of Duet Night Abyss with detailed, interactive maps at [**duetnightabyss.th.gl**](https://duetnightabyss.th.gl).

**Available regions:**
- 🏝️ **Purgatorio Island**
- 🌆 **Eastern District, Icelake** (includes Glevum Pit, Icelake Sewers & Galea Theatre)
- 🏰 **Lonza Fortress**

Each map includes markers for:
- 👹 **Geniemon**
- 📦 **Chests & collectibles**
- 🪨 **Materials**
- 🧑‍🤝‍🧑 **NPCs**
- 📍 **Other exploration points**

Click any marker to track your progress, mark locations as discovered, and ensure you never miss important spots.

## 🧭 Activity Tracker: Stay on Top of Your Goals

Managing daily and weekly activities just got easier with the new **Activity Tracker**:

👉 [**duetnightabyss.th.gl/activities-tracker**](https://duetnightabyss.th.gl/activities-tracker)

This tool lets you:
- ✅ Track daily and weekly activities
- 🎯 Manage your in-game routine
- 💾 Save progress directly in your browser
- 🎨 Clean, customizable interface

It's perfect for players who want to maximize their efficiency without losing track of what's left to do.

## 📱 Coming Soon: THGL Companion App Support

Next week, I'll be adding **Duet Night Abyss support to the THGL Companion App**.

This means you'll be able to:
- 🖥️ Use overlays and second-screen modes
- 📍 Get real-time position tracking (once available)
- 🎮 Access maps and tools without leaving the game

Stay tuned for the update announcement!

## 🙏 Thank You for the Support

These updates are made possible by the amazing TH.GL community. If you'd like to support the project and unlock **Pro features** like ad removal and early access, check out the [**Support Me**](https://www.th.gl/support-me) page.

—

Enjoy exploring Duet Night Abyss — and feel free to [join the Discord](https://th.gl/discord) if you have feedback or suggestions! 🌙

— DevLeon
`.trim(),
    contentReference: [
      "Duet Night Abyss",
      "TH.GL",
      "interactive maps",
      "activity tracker",
      "Purgatorio Island",
      "Eastern District",
      "Icelake",
      "Glevum Pit",
      "Icelake Sewers",
      "Galea Theatre",
      "Lonza Fortress",
      "Geniemon",
      "THGL Companion App",
      "Discord",
      "Support Me",
    ],
  },
  {
    id: "web-code-now-public",
    headline: "The Web Code Is Now Public",
    title: "The Code Is Now Public — Here's Why",
    description:
      "After years of building TH.GL solo, the web components source code is now available on GitHub. Here's what's open, what's not, and how you can contribute — especially with AI tools like Claude Code.",
    date: "2025-10-02",
    content: `
Over the past few years, I've been asked countless times: **"How does the map work?"**, **"Can I see the code?"**, or **"How do you handle X feature?"**

Today, I'm happy to share that the answer is now: **Yes — go look for yourself!**

## 🔓 The Code Is Now Public

The **TH.GL web components** monorepo is now available on GitHub:

👉 [**github.com/The-Hidden-Gaming-Lair/thgl-web-components**](https://github.com/The-Hidden-Gaming-Lair/thgl-web-components)

This includes:
- 🌐 All game-specific **web apps** (palworld.th.gl, duneawakening.th.gl, etc.)
- 🎮 All **Overwolf apps** (in-game overlays)
- 📦 Shared **UI components** and **libraries**
- ⚙️ Build configs, CI/CD workflows, and tooling

It's the full frontend codebase — everything that powers the maps, filters, overlays, and interactive features you use every day.

## 🤔 Why Now?

I've been building TH.GL solo for years, and it's grown way beyond what I imagined.

But I've reached a point where **I can't handle all the requests and suggestions on my own anymore**.

There are dozens of feature requests, bug reports, and small improvements sitting on the [**suggestions-issues page**](https://www.th.gl/suggestions-issues) — many of which I'd love to implement, but simply don't have the time for.

By opening the code, I'm hoping the community can help out. Whether it's fixing a bug, adding a feature, improving documentation, or even translating the UI — **all contributions are welcome**.

## 📖 What's Open (and What's Not)

### ✅ What's Public:
- **thgl-web-components** — all web apps, Overwolf apps, shared UI/libraries
- Full access to the codebase, issues, pull requests, and discussions

### 🔒 What's Still Private:
- **Data mining tools** (extracting game data from files)
- **Memory reading tools** (real-time position tracking)
- **Companion app internals** (Windows desktop app)

These stay private for security, anti-cheat, and licensing reasons.

## ⚖️ The License: What You Can (and Can't) Do

The code is **source-available, but NOT open source**.

**You CAN:**
- ✅ Read and explore the code
- ✅ Submit pull requests with improvements
- ✅ Learn from the code and use it as a reference
- ✅ Report issues and suggest features

**You CANNOT:**
- ❌ Deploy your own version of TH.GL (with or without ads)
- ❌ Reuse the code for your own projects
- ❌ Fork it to build competing services

Think of it as **"view and contribute only"** — not a free-for-all.

All rights remain reserved. If you're interested in forking or licensing the code for something else, reach out to me directly.

## 🤖 Contributing with AI — It's Easier Than Ever

Here's the thing: contributing to open codebases used to require deep familiarity with the project.

But now, with **AI tools like Claude Code**, you can jump in much faster.

I've included a **[CLAUDE.md](https://github.com/The-Hidden-Gaming-Lair/thgl-web-components/blob/main/CLAUDE.md)** file in the repo that provides context for AI assistants — so if you're using Claude Code (or similar tools), it can help you:
- Understand the project structure
- Navigate the monorepo
- Suggest fixes or improvements
- Write code that matches the existing style

Even if you're not an expert in React, Next.js, or TurboRepo — AI can help bridge the gap.

**Want to try?** Check out the [**README.md**](https://github.com/The-Hidden-Gaming-Lair/thgl-web-components/blob/main/README.md), let Claude (or your AI tool of choice) read the [**CLAUDE.md**](https://github.com/The-Hidden-Gaming-Lair/thgl-web-components/blob/main/CLAUDE.md), and start exploring.

## 🛠️ A Few Technical Notes

### The Monorepo
The codebase is organized as a **TurboRepo monorepo** — each game has its own web app and Overwolf app, with shared packages for UI components and logic.

It's grown organically over the years, and honestly, **I wouldn't structure it this way if I started fresh today**. But it works, and it's what we have.

### High-Performance Maps
The current maps are built on **Leaflet** and optimized for performance — even with thousands of markers.

But I'm also working on a **modern replacement with WebGL2 support** (check out the **feat/thgl-map** branch if you're curious). The new renderer will support:
- 🔄 **Map rotation**
- 🎯 **Perspective changes**
- ✨ **Smoother controls and interactions**

It's still experimental, but it's coming.

![Experimental Map Preview](/images/thgl-map-experimental.png)

## 💬 Where to Contribute

Not sure where to start? Here are some ideas:

1. **Check the [suggestions-issues page](https://www.th.gl/suggestions-issues)** — these are community requests pulled from Discord
2. **Improve documentation** — add comments, write guides, clarify configs
3. **Fix bugs** — test the apps and submit fixes
4. **Add translations** — help localize the UI for other languages

If you want to discuss contributions or get help, join the [**Discord**](https://th.gl/discord) — I'm active there and happy to guide new contributors.

## 🙏 Thank You

Building TH.GL has been an incredible journey, and I'm excited to see what happens now that the code is open.

If you've ever wanted to peek under the hood, contribute a feature, or just see how something works — **now's your chance**.

And if you'd like to support the project financially (and unlock Pro perks like ad removal), check out the [**Support Me**](https://www.th.gl/support-me) page.

Thanks for being part of this journey.

— DevLeon
`.trim(),
    contentReference: [
      "GitHub",
      "thgl-web-components",
      "monorepo",
      "TurboRepo",
      "Overwolf",
      "Leaflet",
      "WebGL2",
      "Claude Code",
      "CLAUDE.md",
      "suggestions-issues",
      "Discord",
      "open source",
      "source-available",
      "contributions",
      "pull requests",
    ],
  },
  {
    id: "overlay-input-freeze-fix",
    headline: "Overlay Input Freeze Fix",
    title: "How We Fixed the Overlay Input Freeze in the THGL Companion App",
    description:
      "Some users reported that the THGL overlay stopped responding after a few minutes — while hotkeys still worked. After days of debugging and community testing, the cause and a permanent fix are finally here.",
    date: "2025-09-12",
    content: `
## 🧩 The Issue

After releasing the rewritten **THGL Companion App**, some users began reporting that the overlay would **stop responding to clicks** after a few minutes — even though:

- Hotkeys still worked perfectly  
- The map was still updating in real time  
- Restarting sometimes helped, but only for a few minutes

Interestingly, this problem **wasn’t universal**:  
- It happened frequently for some users while playing **Dune Awakening**  
- Others only saw it in **Palia**  
- Most players never experienced it at all

This made it *very* hard to reproduce and fix.

## 🕵️ What We Discovered

The overlay depends on low-level mouse input events from \`WM_INPUT\`.  
However, these messages are posted to the same message queue as everything else in the overlay — including rendering, UI logic, and other work.

If the overlay process gets **slightly overloaded** (for example while rendering large map updates), the message queue can start backing up.  
Once it fills up far enough, **\`WM_INPUT\` stops being dispatched entirely**, even though the rest of the app keeps running.

This explains:

- Why it happened more often in heavier games like **Dune Awakening**  
- Why it sometimes showed up in lighter games like **Palia**  
- Why it never happened at all on faster PCs  
- Why the freeze didn’t occur immediately — the backlog slowly built up

## ⚡ The Fix

The solution was to **move input handling into its own dedicated thread**.

- The input thread now receives all \`WM_INPUT\` events directly  
- It forwards them to the overlay window using \`PostMessage\`  
- This keeps input processing smooth and isolated from heavy rendering work

Since implementing this, testers have reported **no further freezes** — even after hours of use.

## 💡 Lessons Learned

- Don’t run time-critical input logic on the same thread as rendering/UI  
- \`WM_INPUT\` can silently stop arriving if the main queue is congested  
- Having a community willing to test builds is *invaluable* 🧡

## 📦 THGL Companion App Rewrite

This fix shipped as part of the larger rewrite of the [**THGL Companion App**](https://www.th.gl/companion-app):

- 🧠 No more game injection (safer, more stable)  
- 🎯 Much lower memory usage and CPU load  
- 🗺️ Support for new games like **Dune Awakening**  
- 🐛 Fixes for various issues (like missing fish locations and weekly wants)

If you’re happy with the **Overwolf** version, you can keep using it —  
but if you want the new architecture and fixes, try the Companion App!

`.trim(),
    contentReference: [
      "WM_INPUT",
      "PostMessage",
      "RegisterRawInputDevices",
      "message queue",
      "input thread",
      "THGL Companion App",
      "Dune Awakening",
      "Palia",
      "Overwolf",
    ],
  },
  {
    id: "soulframe-grounded2-subreddit-update",
    headline: "Soulframe Maps, Grounded 2 Preview & New Subreddit",
    title:
      "Soulframe Support, Grounded 2 Preview Release, and a Quick Summer Heads-Up",
    description:
      "Soulframe interactive maps are now live on TH.GL! Grounded 2 enters preview for Elite Supporters, plus a new subreddit is now open for updates and discussion. Also: I’m taking a short summer break.",
    date: "2025-07-01",
    content: `
**The Hidden Gaming Lair** is expanding again — with a new game, a preview launch, a community update, and a quick summer break heads-up.

## 🌿 Soulframe Interactive Map Now Live

Soulframe has joined the lineup of supported games on TH.GL!

You can now explore a beautiful, interactive map at [**soulframe.th.gl**](https://soulframe.th.gl).  
If you're jumping into the game or just curious about the world, this is a great way to start getting familiar with the map and layout.

Expect more features over time as the game evolves!

> ![Soulframe Map](/images/soulframe-map-preview.jpg)

## 🐞 Grounded 2 — Early Preview Release

A brand-new game is in development: **Grounded 2**!  
It’s still early in development, but **Elite Supporters** now have access to a **preview version**.

🔒 If you’re in that group, check the private \`#preview-access\` channel on Discord for the link and details.

> Feedback is welcome — just know that things are still in progress and subject to change!

## 💬 New Subreddit for Updates & Community

I’ve launched a new subreddit to help share updates and encourage discussion outside of Discord:

👉 [**r/TheHiddenGamingLair**](https://www.reddit.com/r/TheHiddenGamingLair/)

I'll be cross-posting updates there regularly — so if you prefer Reddit or want to stay in the loop outside of Discord, give it a follow and join the conversation!

## 🌴 Summer Break Notice

I’ll be on vacation until the **end of August** and will be **partially available** during that time.

Here’s what to expect:
- 🛠️ I’ll fix **critical issues** if they come up
- 🧪 I plan to continue working on **Grounded 2** during a few open days
- 🚫 No major new features will ship until I’m back fully

Thanks so much for your ongoing support and patience — it really means a lot.

If you’d like to support the project, unlock early features, or go ad-free, check out the [**Support Me**](https://www.th.gl/support-me) page.

—

Enjoy the summer (or winter, depending where you are) — and happy exploring! 🌍  
— DevLeon
`.trim(),
    contentReference: [
      "Soulframe",
      "TH.GL",
      "Grounded 2",
      "Elite Supporters",
      "r/TheHiddenGamingLair",
      "Reddit",
      "Discord",
      "preview access",
      "summer break",
      "Support Me",
    ],
  },
  {
    id: "dune-awakening-map-release",
    headline: "Dune Awakening Maps Are Live",
    title: "Dune Awakening Interact Maps Now Available on TH.GL",
    description:
      "Explore Hagga Basin, Arrakeen, Harko Village, and The Deep Desert with detailed interactive maps for Dune: Awakening. Solo tools, group strategy, and private servers included.",
    date: "2025-06-04",
    content: `
**Dune: Awakening** is about to launch — and TH.GL is ready.  
Starting today, you can explore detailed, interactive maps for this ambitious new survival MMO.

## 🗺️ Fully Interactive Maps for Dune Awakening

Whether you're a solo explorer or part of a guild, [**duneawakening.th.gl**](https://duneawakening.th.gl) now offers full coverage for:

- 🏜️ **Hagga Basin**
- 🏙️ **Arrakeen**
- 🏚️ **Harko Village**
- 🌵 **The Deep Desert**

Each map includes markers for:
- 📍 Trainers
- 📦 Items
- 🧑‍🤝‍🧑 NPCs
- 🪨 Resources

Click to track progress, mark locations as discovered, and make sure you never miss a key spot on Arrakis.

> ![Discovered Marker](/images/dune-marker-dialog.webp)

## 👥 Built for Groups and Guilds

The maps aren’t just for solo play.  
For group coordination and guild planning, you’ll find:

- **Shared filters**  
  Draw paths, place custom markers, and share them with others.
- **Whiteboard mode**  
  Perfect for live strategy planning and PvP coordination.

> ![Add Drawing](/images/dune-drawing-dialog.webp)

## 🛠️ Private Servers Are Live

Want to explore Arrakis with friends or set up your own RP or PvP events?  
[**Private servers**](https://duneawakening.th.gl/private-servers) are available — powered by [**xREALM**](https://xrealm.com) and integrated into TH.GL.  

## 📚 Need More Info?

For a detailed **item and recipe database**, check out [**dune.gaming.tools**](https://dune.gaming.tools/) — a fantastic resource built by a fellow developer.

## 🗓️ Launch Timeline

- 🎮 **Pre-release:** June 5, 2025  
- 🚀 **Full release:** June 10, 2025  

I'm actively updating the maps as more player data comes in — expect more features and refinements after launch.

## 🔧 Feedback + Support

If you run into bugs, have suggestions, or want to connect with other players, feel free to [join the Discord](https://th.gl/discord).

And if you'd like to support the project and unlock Pro perks (like ad removal and early access features), check out the [Support Me](https://www.th.gl/support-me) page.

—

Thanks for exploring Arrakis with me — and enjoy the dunes! 🐛  
— DevLeon
`.trim(),
    contentReference: [
      "Dune Awakening",
      "Hagga Basin",
      "Arrakeen",
      "Harko Village",
      "The Deep Desert",
      "xREALM",
      "private servers",
      "dune.gaming.tools",
      "guild planning",
      "whiteboard mode",
      "PvP coordination",
    ],
  },
  {
    id: "palia-elderwood-expansion",
    headline: "Palia Elderwood Expansion",
    title: "Explore the Elderwood: Palia Expansion + Companion App Update",
    description:
      "Palia just expanded! The new Elderwood region is now live on palia.th.gl, the Overwolf app, and the TH.GL Companion App. Here's everything you need to know.",
    date: "2025-05-16",
    content: `
  Palia just received a [major update](https://palia.com/news/patch-191) — **The Elderwood Expansion** — and TH.GL is already updated to match!
  
  ## 🗺️ Elderwood Region Now Available
  
  The newly unlocked **Elderwood** area is now included on [palia.th.gl](https://palia.th.gl) and both the Overwolf and Companion App versions of the map.
  
  You’ll find **new creature filters**, including:
  
  - 🐸 **Ogopuu**  
  - 🐿️ **Shmole**  
  - 🪨 **Rockhopper**
  
  *Spawn locations will continue to be updated over the next few days as player data rolls in.*
  
  > ![Elderwood Expansion Screenshot](/images/palia-elderwood.webp)
  
  ## 🖥️ Overwolf App Updated to v4.1.0
  
  The Overwolf app is now at **version 4.1.0**, adding **position tracking support for the new region**.
  
  If you're using the in-game app, make sure you've updated to get full tracking coverage inside Elderwood.
  
  ## 💻 Companion App Now Supports Palia
  
  The [**TH.GL Companion App**](https://www.th.gl/companion-app) now supports Palia!
  
  This standalone app is an alternative to Overwolf with a more lightweight and privacy-friendly setup:
  
  - ✅ No Overwolf required  
  - ✅ Runs faster and uses fewer resources  
  - ✅ Includes real-time overlays and second-screen support  
  - ✅ Cross-game support with shared features
  
  A few features like **weekly wants** and **star level tracking** are still in the works, but are coming soon.
  
  ## 🙌 Thank You for the Support
  
  These updates wouldn’t be possible without the amazing community supporting TH.GL.  
  If you'd like to help out and unlock **Pro features** (like ad removal and early access), you can support me on [Patreon](https://www.th.gl/support-me).
  
  Also, don't forget to link your account on the [account page](https://www.th.gl/support-me/account) to activate your perks!
  
  —
  
  Thanks for reading, and enjoy exploring the Elderwood 🌲  
  Feel free to join [the Discord](https://th.gl/discord) if you run into issues or just want to chat.
  
  — DevLeon
    `.trim(),
    contentReference: [
      "Palia",
      "Elderwood",
      "Elderwood Expansion",
      "Ogopuu",
      "Shmole",
      "Rockhopper",
      "Overwolf",
      "TH.GL Companion App",
      "weekly wants",
      "star level tracking",
      "Patreon",
    ],
  },
  {
    id: "why-i-built-companion-app",
    headline: "Standalone Companion App",
    date: "2025-05-07",
    title: "Why I Created a Standalone Companion App After 10+ Overwolf Apps",
    description:
      "After years of developing Overwolf apps, I built the TH.GL Companion App to be lighter, faster, and more flexible — with overlays, live maps, and tracking tools outside of Overwolf.",
    content: `
In 2016, I built my first Overwolf app during the **League of Legends Overwolf Dev Challenge** — and won it with *Trophy Hunter*, an achievement tracker for LoL. That experience kicked off my journey into building tools for gamers.

Since then, I’ve developed more than 10 Overwolf apps for games like **New World**, **Palworld**, **Once Human**, **Infinity Nikki**, and many others.

But in 2025, I launched something entirely new: the **TH.GL Companion App** — a standalone application, independent from Overwolf.

### Overwolf Was a Great Start

Overwolf gave me the tools I needed:
- A strong API for overlays, hotkeys, and in-game data
- Automatic updates and app store visibility
- A way to focus on app development, not deployment infrastructure

It worked well for many years, especially while I was building these tools alongside a full-time job.

### Why I Built My Own

Over time, I began hearing requests for a more lightweight solution. Some users wanted a version of the tools **without extra background services**, installations, or performance overhead.

There were also challenges on the development side. Occasionally, I had to delay updates because of Overwolf platform issues like:
- Missing support for certain games or DX versions
- Crashes and performance issues that weren’t under my control

Eventually, I decided I wanted to try building my own system — one that would give me more control, flexibility, and fewer dependencies.

![Palworld Overlay](/images/overlay-palworld.webp)

### What’s Inside the Companion App

The TH.GL Companion App offers:
- Overlay + second-screen toggle
- Real-time player tracking
- Support for multiple games, including **Palworld**, **Once Human**, **Infinity Nikki**, and more

All without needing to install or run Overwolf.

![App Launcher](/images/app-launcher.webp)

### The Benefits

By moving away from Overwolf, I can:
- Push updates and support new games much faster
- Avoid waiting for platform fixes
- Deliver a smoother experience with fewer restrictions
- Keep everything lightweight and performance-focused

Plus, it’s been a great learning experience — diving into DX injection, overlay rendering, and everything required to build an app like this from scratch.

### How’s It Going?

The Companion App is still new, but I’ve already seen **hundreds of daily users**, even with a soft launch. It’s far from done, but the core functionality is solid, and I’m updating it regularly based on feedback.

![Second Screen Mode](/images/second-screen.webp)

### Try It Yourself

Want to try it?

[👉 Download the TH.GL Companion App](/companion-app)

And if you’d like to support development or remove ads, check out [Support Me](/support-me).

Thanks for reading — and stay tuned for what's next!
      `.trim(),
    contentReference: [
      "TH.GL Companion App",
      "Overwolf",
      "Trophy Hunter",
      "League of Legends",
      "New World",
      "Palworld",
      "Once Human",
      "Infinity Nikki",
      "DX injection",
      "overlay rendering",
      "second-screen",
    ],
  },
];

export const allBlogContentReferences: BlogContentReference[] = Array.from(
  new Set(blogEntries.flatMap((entry) => entry.contentReference)),
).sort((a, b) => a.localeCompare(b));
