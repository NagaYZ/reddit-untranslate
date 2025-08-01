# Reddit Untranslate

A userscript that disables Reddit's auto-translation feature and removes Google translation parameters.

## Features

- Removes Google translation parameters from URLs
- Disables Reddit's auto-translation cookies
- Blocks translation-related API calls
- Prevents automatic translation toggles
- Works with Reddit's single-page navigation

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

2. Install the script:
   - [Install from GreasyFork](https://greasyfork.org/fr/scripts/544341-reddit-auto-translation-disabler)
   - Or install directly from this repository: [reddit-auto-translation-disabler.user.js](https://raw.githubusercontent.com/NagaYZ/reddit-untranslate/main/reddit-auto-translation-disabler.user.js)

## How It Works

The script:
- Intercepts and modifies translation-related cookies
- Blocks translation API requests
- Removes translation URL parameters
- Monitors and disables translation UI elements

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

NagaYZ

## Links

- [GreasyFork Page](https://greasyfork.org/fr/scripts/544341-reddit-auto-translation-disabler)
- [Report Issues](https://github.com/NagaYZ/reddit-untranslate/issues)