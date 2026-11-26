+++
title = "Mood Tracker"
description = "A local-first Android journal for recording how you feel and seeing patterns over time."
path = "projects/mood-tracker"
template = "mood-tracker.html"

[extra]
image = "images/mood-tracker.png"
image_size = 192
store_url = "https://play.google.com/store/apps/details?id=dev.gdario.moodtracker.production"
intro = [
    "A case study over a journaling android app. The core tenets of the app focused around providing a reflective space to the user that felt physical.",
    "The infrastructure and delivery was engineered through human first agentic development principles.",
]
initial_concept = "Mood Tracker began with the openness of the sky and how its colours change through the day. Autumn and winter sunrises were a particular inspiration, with their intense shifts from indigo and violet through rose to gold. The aim was to bring that sense of openness into a quiet journal that stays out of the way and gives people room to reflect. The design framework came first and guided how the app was built."
framework_intro = [
    "WCAG guidance on contrast and the use of colour informed later refinements. Scientific colour scales such as [cividis](https://doi.org/10.1371/journal.pone.0199239) and [viridis](https://bids.github.io/colormap/) inspired the progression from dark indigo to light gold. The five moods kept their lightness order in colour-vision simulations.",
    "Motion and haptics give the app a more physical feel. Google’s Material Design and Apple’s Human Interface Guidelines informed those choices. Andrea diSessa’s concept of [phenomenological primitives (p-prims)](https://interfaces.com/blog/2010/10/what-is-a-p-prim/) offered another way to think about them. Familiar cues about how things move and respond can help people understand what the app is doing without stopping to read an explanation.",
]
check_in_description = [
    "Check-in was designed to be easy to use and playful. Motion connects choosing a mood, adding an optional note, and saving the entry so the steps feel like one interaction. Each transition is brief enough to keep attention on the check-in itself.",
    "This screen set the direction for the rest of Mood Tracker. It established how much information to show at once, how the controls should look and respond, and how the app could give people room to reflect even in a brief interaction.",
]
journal_description = [
    "The Journal brings relevant entries from the past back into view. Full-text search helps people find notes by what they wrote, and activity filters let them narrow the list to the entries they want to revisit.",
    "A small unread dot on “On this day” signals that a memory is available. The prompt stays in the Journal, where people can choose to open it or keep browsing at their own pace.",
]
+++
