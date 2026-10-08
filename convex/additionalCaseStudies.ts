import type { CaseStudySeed } from "./seedData";

export const nationCaseStudy: CaseStudySeed = {
  slug: "nation-rts",
  title: "Nation — Building a Historical Strategy Game",
  companyOrProject: "Nation",
  summary: "I'm building a strategy game focused on African history, using the open-source real-time strategy game 0 A.D. as a foundation. The project involves learning an unfamiliar game engine, designing new gameplay systems, modifying simulation rules, and testing whether the changes work together in a playable game.",
  sections: [
    { slug: "context", heading: "Context", order: 1, body: `I wanted to make a historical strategy game that takes African states, institutions, and political development seriously.

Building an entire game engine from scratch would have meant spending most of my time on infrastructure that already exists. I chose to start with 0 A.D., an open-source real-time strategy game with an established engine, simulation, unit system, and map infrastructure.

The challenge is that the game I want to make is not simply 0 A.D. with different buildings and unit names. I want to change how the game represents political development, territory, institutions, and the growth of a state.

That means understanding how the existing game works before deciding what to replace, extend, or leave alone.` },
    { slug: "responsibilities", heading: "Responsibilities", order: 2, body: `- Forked the 0 A.D. codebase as the foundation for a new game.
- Studied how the engine separates simulation components, entity templates, game data, and user-facing behavior.
- Designed new gameplay systems around political development and sovereignty.
- Added custom simulation logic and corresponding tests.
- Modified entity availability, construction rules, and progression requirements.
- Created development scenarios for testing new mechanics.
- Used automated tests and game startup checks to catch integration problems.
- Worked through compatibility constraints while preserving the existing engine's core behavior.` },
    { slug: "unfamiliar-engine", heading: "Learning an unfamiliar game engine", order: 3, body: `I came into the project without professional game-engine experience.

My first problem was understanding where gameplay behavior actually lives. In 0 A.D., a unit or building is not defined by one piece of code. Its behavior depends on entity templates, simulation components, technology and phase requirements, and other systems.

A change that looks simple at the design level can affect several of these at once.

I had to learn how those pieces fit together so I could change game rules without accidentally breaking construction, progression, or simulation behavior.` },
    { slug: "political-development", heading: "Political development and sovereignty", order: 4, body: `One of the main design goals is to make the growth of a state part of the game itself.

Rather than treating advancement as a simple sequence of technology upgrades, I've been working on systems that represent stages of political development and the institutions available at each stage.

This includes progression requirements, sovereign construction rules, and the relationship between buildings and territorial control.

The challenge is making those ideas work as actual game mechanics. A historically interesting rule is not useful if it makes the game impossible to progress through or breaks the existing simulation.` },
    { slug: "playability", heading: "Making the game playable", order: 5, body: `A recurring part of the work has been testing whether the new systems function together.

For example, progression requirements have to be consistent with the population and resources available in a scenario. Buildings have to become available at the right stage, and their placement rules have to agree with the intended political system.

I've been adding deterministic tests for these rules rather than relying entirely on manual play.

In the third development milestone, I corrected population gates, updated progression and project requirements, and adjusted the Court building's construction and sovereignty behavior. I also added tests for the relevant requirements, templates, and builder availability.

These changes were checked against the Nation JavaScript test suite and game-start scenarios.` },
    { slug: "existing-codebase", heading: "Working with an existing codebase", order: 6, body: `The project has been a useful exercise in deciding when to reuse an existing system and when to introduce new behavior.

Reusing the engine saves an enormous amount of work. But it also means new mechanics must fit within assumptions made by the original game.

I have to distinguish between changes that belong in data templates, changes that require new simulation components, and changes that would require deeper engine work.

That is a different kind of engineering from building a new application where I control the architecture from the beginning.` },
    { slug: "tools", heading: "Tools and technologies", order: 7, body: "0 A.D., Pyrogenesis (the underlying game engine), JavaScript simulation components, XML entity templates, automated simulation tests, Git, GitHub, and AI-assisted code investigation and development. I use these tools together to inspect the engine, change simulation behavior, express game data, run deterministic checks, and keep the work recoverable while the project is still changing." },
    { slug: "current-status", heading: "Current status", order: 8, body: `Nation is an ongoing experiment, not a finished game.

The work so far is focused on the simulation foundation, progression systems, sovereignty rules, and playable development scenarios.

The next challenge is to turn these individual systems into a coherent game with distinctive civilizations, art, maps, and mechanics.

I'm treating the project as both a game I want to make and a way to learn how a large, unfamiliar software system can be changed without rebuilding it from scratch.` },
  ],
};

export const audioPluginCaseStudy: CaseStudySeed = {
  slug: "audio-plugin-development",
  title: "Audio Plugin Development",
  companyOrProject: "Personal audio software projects",
  summary: "I'm building audio plugins for music production. One is designed to shape kick drums through compression, equalization, and visual feedback. Another explores automatic vocal harmonization. Both have required me to learn C++, digital audio processing, and how to build software that works inside a digital audio workstation.",
  sections: [
    { slug: "context", heading: "Context", order: 1, body: `I make music, and I wanted to build some of the tools I use.

Audio plugins interested me because they combine several problems I enjoy working on: sound processing, interface design, performance, and compatibility with other software.

I had experience building web applications, but very little experience with C++ or digital signal processing. I started learning both while building the plugins.` },
    { slug: "responsibilities", heading: "Responsibilities", order: 2, body: `- Built a VST3 audio effect using C++, a programming language commonly used for performance-sensitive software.
- Used JUCE, a framework that provides the foundations for building audio plugins.
- Implemented compression controls for shaping the dynamics of kick drums.
- Built a three-band parametric equalizer for adjusting different frequency ranges.
- Created visual feedback for audio levels, gain reduction, and frequency content.
- Designed a custom interface with rotary controls, meters, and rendered graphical assets.
- Worked on plugin state, parameter automation, and compatibility with digital audio workstations.
- Used CMake, a tool that organizes how C++ projects are compiled and built.
- Began developing a separate plugin for generating vocal harmonies.` },
    { slug: "kick-processor", heading: "Building a kick drum processor", order: 3, body: `The first plugin began with a simple idea: I wanted a tool that could shape the sound of a kick drum without requiring several separate effects.

I combined a compressor and an equalizer in one interface.

The compressor controls how the volume of a sound changes over time. It includes settings for threshold, ratio, attack, release, and other parameters.

The equalizer lets the user adjust the low, middle, and high frequency ranges.

I also built visual feedback so the user can see the audio level, how much compression is being applied, and the frequency content of the sound.` },
    { slug: "real-time-audio", heading: "Learning real-time audio processing", order: 4, body: `Audio software introduced constraints I hadn't encountered in the same way when building web applications.

A plugin has to process audio continuously. If an operation takes too long, it can cause clicks, glitches, or interruptions.

One example was the frequency analyzer.

The plugin needs to collect audio samples and calculate which frequencies are present. But running those calculations directly in the audio-processing path could interfere with playback.

I built a system that passes samples to the interface without making the audio-processing thread wait. The interface performs the frequency calculations separately.

If the interface falls behind, it can skip visualization data rather than interrupt the sound.

This was one of the first places where I had to think carefully about how different parts of a program share work.` },
    { slug: "interface", heading: "Designing the interface", order: 5, body: `I wanted the plugin to feel like a proper music production tool, not a collection of default controls.

I designed custom knobs, meters, typography, and graphical elements. Some of the interface assets were rendered in 3D and then incorporated into the plugin.

The interface also had to remain connected to the underlying audio processing.

When a user adjusts a control, the sound needs to change correctly. The digital audio workstation also needs to be able to save settings and automate parameters.

That meant working across the interface, audio engine, and plugin state management.` },
    { slug: "host-application", heading: "Building software for another application", order: 6, body: `Unlike a website, an audio plugin runs inside another application.

I had to learn how plugins are compiled, packaged, loaded, and controlled by a digital audio workstation.

I also had to investigate compatibility problems, including crashes and unexpected behavior during testing.

The plugin uses embedded graphical assets so its interface does not depend on separate files being present on the user's computer.` },
    { slug: "vocal-harmonization", heading: "Exploring automatic vocal harmonization", order: 7, body: `My second plugin explores automatic vocal harmonization.

The idea is to take a vocal performance and generate additional voices at different musical intervals.

This introduces a different set of problems from compression and equalization. The software needs to work with pitch, musical relationships, and the generation of new audio voices.

This project is still in development. I'm using it to learn more about pitch processing and the challenges of building musical effects that sound natural.` },
    { slug: "tools", heading: "Tools and technologies", order: 8, body: "C++17, JUCE (audio application development framework), CMake (C++ build system), VST3 (audio plugin format), digital signal processing, frequency analysis, GitHub Actions (automated builds), Blender (3D graphics), and digital audio workstations. Together these cover the plugin's processing code, user interface, build and packaging workflow, automated verification, visual assets, and the host environments in which the software is tested." },
    { slug: "current-status", heading: "Current status", order: 9, body: `The kick drum processor has an implemented audio-processing and interface foundation, with ongoing testing and refinement.

The automatic harmonization plugin is a separate project still in development.

Neither project is evidence that I'm an experienced audio software specialist. They show how I've approached learning a new technical field by building software in it.` },
  ],
};
