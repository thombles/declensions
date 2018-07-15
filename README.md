# declensions
Russian Declension-o-matic - quickly locate declension tables for Russian words on Wiktionary

Hosted version: [https://thomask.sdf.org/ru-declensions/](https://thomask.sdf.org/ru-declensions/)

Uses HTTP requests to the English Wiktionary API, within your browser, to attempt to locate the declension tables for a given word.

The algorithm to locate the tables is pretty dodgy and may break. If you notice it failing on any words that it should be able to pick up, please open an issue.

## Licensing

This code is distributed according to the Unlicence (see LICENCE), *except* for the Levenshtein distance algorithm, which is included under the MIT licence. See the bottom section of ru_declensions.js.

