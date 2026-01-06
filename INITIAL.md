## FEATURE:

**Project Title:** streaming-tracker
**Project Description:** Web based Streaming Services Tracker
**Project Directory:** /home/sfeltner/Projects/streaming-tracker
**Architecture:**
- RESTful API
**Programming Language:**
- Frontend: Javascript,CSS,HTML
- Backend: Node.js with Express.js
**Software License:** Apache 2.0

**Dependencies:**
- External libraries: None
- Standard libraries may be used without listing.

**Frameworks:**
- Frontend: React

**Data Storage:**
- Tracking data: Neo4j
- Documentation: Amazon S3

A modern, elegant web-based frontend application to manage, update and
administer movies and series available on streaming services, like Netflix,
Amazon Prime, HBO/Max, etc. 

The intent is to maintain three categories of lists:
Currently Watching, Watch Queue and Already Watched. These lists can be
maintained across various film genres, e.g. Sci-Fi, Drama, Comedy, etc. These
lists need to be scalable as the lists may grow to thousands of titles. The
user should be able to '+' Add a New List, which would present a form with a
radio button to select one or more genres for this new bucket of lists and
another set of radio buttons for previously selected Streaming Services. The
user should be able to add a new Streaming Service to include they now have
access to movies and series on that service. The selection of the available
streaming services should default to the last selection of services, if a
previous selection had been made for a group of lists created earlier. There
should also be the ability to indicate that this group of lists is for Movies,
Series or All.

Movement within the lists should be similar to a workflow, without being
strict. Step 1: Titles are added to the Watch Queue for a specific genre or
group of genres. Step 2: At some point, the user will want to move a title from
the Watch Queue to the Currently Watching list. The title may be added directly
to the Currently Watching list without being added to the Watch Queue. Once the
title has been watched, it should be simple to have it moved from the Currently
Watching list to the Already Watched list. Titles may be added to the Already
Watched list arbitrarily. When titles are moved or created in the Already
Watched lists, a simple 5 star rating should be available for the user to
indicate their level of interest in this title. This interest rating should be
used within the AI recommendation agent to improve and refine the recommendation
results in the future.

An AI agent should be engaged that can, on request by button push, recommend 
new movies or series based on the genre or genres selected for a given list
based on the ratings the user has given to titles in the Already Watched list.
Recommendation results should include the title, streaming service and a
synopsis of the move or series. Once the recommendation list is presented, the
user should be able to have the option to move the title to the appropriate
list or be dismissed.
 
## EXAMPLES:

Initially, the user needs to be presented with the Streaming Services selection
form. The initial choices should include Netflix, Disney+, Hulu, Amazon Prime
Video, Discovery+, Apple TV+, HBO/Max. Next, the user should automatically be 
presented with their first list creation form, including genre selection,
streaming services selection and a selection of Movies, Series, All. 

At this
point the 3 lists should be created in the database and, within the interface,
the genre(s) should become available within a master menu for future editing.
The user can then select that list from the master selection menu. The 3 lists
for this genre(s) should be presented in 3 column interface similar to an Agile
board where titles can be created or moved in a logical flow.

On future visits to the app, the user can create new lists, add new genres, add
new streaming services, as separate tasks

## DOCUMENTATION:

- `README.md` must contain:
  - Project title & description
  - Setup and installation instructions
  - How to run the code & tests
  - API documentation
  - Architecture overview
  - Future improvements and roadmap

## OTHER CONSIDERATIONS:

**Testing Requirements:**
- Coverage must include:
  - Unit tests for all backend services and frontend components
  - Integration tests for API workflows
  - End-to-end tests for critical user journeys

**TODO Checklist:**
- Environment setup steps
- File organization tasks
- Optional enhancements (CI/CD, packaging, etc.)

**Output Format:**
- Provide a complete structured project layout in Markdown with tree view.
- Include all files inline: `README.md`, `requirements.txt`, code files, and test files.
- Include the appropriate LICENSE file, if a license is specified.
- Do **not** compress into a single file unless explicitly requested.

**Additional Notes:**
- Create the project directory if it doesn't exist.
- Use clear variable names and add docstrings to all functions.
- Include performance benchmarks in the README.
