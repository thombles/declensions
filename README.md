# Russian Declension-o-matic

**Online copy: [https://thomask.sdf.org/ru-declensions/](https://thomask.sdf.org/ru-declensions/)**

Quickly locate declension and conjugation tables for Russian words. The data comes entirely via the English Wiktionary API. Your browser makes requests directly to Wiktionary when you perform a search.

The algorithm to locate the tables is pretty dodgy and may break. If you notice it failing on any words that it should be able to pick up, please open an issue.

## Usage

It is a completely self-contained HTML file. It should work fine if you upload it to any web space or even save it to your hard drive. (Internet access is required for the Wiktionary API of course.)

If you need to you can specify a word to look up inside the URL. Both `#слово` and `?q=слово` forms are supported. The hash is preferred as it will be updated if the user performs any additional searches after the page opens.

* [https://thomask.sdf.org/ru-declensions/#своем](https://thomask.sdf.org/ru-declensions/#%D1%81%D0%B2%D0%BE%D0%B5%D0%BC)
* [https://thomask.sdf.org/ru-declensions/#следующий](https://thomask.sdf.org/ru-declensions/#%D1%81%D0%BB%D0%B5%D0%B4%D1%83%D1%8E%D1%89%D0%B8%D0%B9)
* [https://thomask.sdf.org/ru-declensions/?q=идут](https://thomask.sdf.org/ru-declensions/?q=%D0%B8%D0%B4%D1%83%D1%82)
* [https://thomask.sdf.org/ru-declensions/?q=восьмой](https://thomask.sdf.org/ru-declensions/#%D0%B2%D0%BE%D1%81%D1%8C%D0%BC%D0%BE%D0%B9)

## Licensing

This project is distributed under the MIT licence and incorporates third-party code. For the full licence conditions please refer to the header of `ru_declensions.htm`.
