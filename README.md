# iNaturalist Tools

[![Fork](https://img.shields.io/badge/fork%20of-glauberramos%2Finat-brightgreen)](https://github.com/glauberramos/inat)

A suite of companion tools for [iNaturalist](https://www.inaturalist.org) — explore your observations, track your progress, and find what to go look for next. Built with vanilla HTML, CSS, and JavaScript, no build step, no external dependencies.

**Fork of [Glauber Ramos](https://github.com/glauberramos/inat)'s original iNaturalist tools repo — thank you for starting it!**

**Live site:** https://WinstonRoe.github.io/inat/

## The tools

### Your stats & progress

- **User Profile** — detailed stats: observation quality grades, identification categories, threatened/endemic/introduced/native species, streaks, and a world coverage map
- **Achievements** — milestones and badges earned from your observations
- **Lifelist Timeline** — your species sorted by first observation date
- **Tree of Life** — how much of the tree of life have you seen? Progress across any taxonomic rank
- **Country States** — track observations across the states of the US, Brazil, Canada, Australia, and France on interactive maps
- **Field Card** — turn your stats into a shareable card you can download

### Explore your species

- **SpeciesDex** — find the species you're missing nearby, Pokédex-style: the most observed species in a place, marked with the ones you've already seen
- **Species Observed** — browse and filter all species you've observed (includes a "My Rarest Species" view — your species with the fewest observations worldwide)
- **Species Identified** — browse species you've identified for others
- **First Observer** / **First Identifier** — species you were the first to record or identify on iNaturalist
- **Top Genera** — your observations grouped by the best-observed rank (genus, family, order, class, phylum, or kingdom), so you can see which genera are your strongest and which you're only sampling — with CSV export
- **Easy Wins** — your pending IDs ranked by how easy the species are to confirm to research grade (the share of the species' verifiable obs the community already research-grades), as a quick-win work queue with deep links and CSV export

### Play

- **Guess the Species** — an unlimited photo quiz: one big mystery-species card at a time, pick the right one from four choices (one correct, three from the same pool). No clock, no score — just a running solved/missed tally. Optionally filter to a specific place to play only species from that area; when the pool runs out, start a new shuffle

### Compare & discover

- **Location Species Compare** — compare species between two places
- **Users Species Compare** — compare species between two users
- **Project Search** — find iNaturalist projects by name and location
- **iNaturalist Top Users** — top observers and identifiers in any place or project, ranked by observations, species, or identifications, with your own position highlighted

### Create & embed

- **Widget Builder** — create embeddable observation widgets for any website
- **Draft Observations** — create drafts, edit images, and submit (beta)

## Running locally

No server or build required. Clone the repo and open `index.html` in your browser — the pages work over `file://`. An internet connection is needed, since everything is fetched live from the iNaturalist API.

## Technical details

- Vanilla HTML/CSS/JS, no external dependencies
- Data comes from the [iNaturalist API](https://api.inaturalist.org/v1/docs/) (observations, species counts, identifications, users, places, projects)
- Species counts use `verifiable=true` to match what iNaturalist's own Explore pages show
- Responsive design with dark mode
