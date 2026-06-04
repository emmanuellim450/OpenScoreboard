# Open Scoreboard

Open Scoreboard provides a platform for providing web based overlays to sport live streams. Using the platform's editor, based off of [GrapesJS](https://github.com/GrapesJS/grapesjs), the user has full control of their scoreboards' presentation, with drag and droppable smart components.

## What does Open Scoreboard do?

Open Scoreboard is a scoreboard suite, built on web technologies. 

Using a real time database, users can update the score on a smart device, and a browser laid over your live stream will instantly update the score. Allowing you to update the graphics in real time, without the need for a large graphics system.

The project was initially built for table tennis scoreboards, but has been adapted to include scoring for Pickleball and Badminton too, and can be adapted for most other sports. 



## Getting Started
1. Clone this repo to your local computer.
2. Install all the dependancies
``` shell
    npm install
    npm run install:children
```
3. Run the application in development mode.
``` shell
    npm run dev
```
4. Open [http://localhost:3000](http://localhost:3000) Ports 3000, 3001, and 3002, must not currently be used, or this process will fail.


## Supported Sports

* Table Tennis
* Pickleball
* Badminton
## Non-supported Sports

**Officially** only the sports above are supported, however, any sport with a similar scoring system can be use this project. 

Sports with **Unsupported** systems, but could be added with contributions from the community.
* Tennis Scoring
    * Would require a sub-score ability, sets won, and current set score.
* Golf Scoring
    * Negatives and Per Person score lists are not supported, only game/matches.
* Clock/Timer
    * Amount of time remaining in the half/quarter, there is no mechanism for this currently.


## License

[GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html)
