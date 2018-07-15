const ST_INITIAL_SEARCH = "Searching for word: ";
const ST_DEFINITION = "Loading definition page: ";
const ST_DONE = "Done.";
const ST_NOT_FOUND = "Couldn't locate a declension table for that word. :(";
const ST_ERROR = "Sorry, an error occurred.";

const TITLE = "Russian Declension-o-matic";

// User pressed the Search button. Run a search query against Wiktionary and suppress form submission.
function doSearch() {
    clearResults();
    const term = getSearchTerm();
    if (term.length == 0) {
        return false;
    }
    updateStatusText(ST_INITIAL_SEARCH + term);
    updatePageTitle(term);
    runWiktionaryApi(makeSearchApiUrl(term, "handleSearchResults"));
    return false;
}

function handleSearchResults(json) {
    // See if we got a page. Not watertight but it'll do.
    if (!json.query || !json.query.search ) {
        error();
        return;
    }

    // Filter out any that have spaces in them. Multi-word phrases can mess up our results.
    const results = json.query.search.filter(function(r) {
        return r.title.indexOf(" ") == -1;
    });

    if (results.length == 0) {
        updateStatusText(ST_DONE);
        showSearchResultLink(getSearchTerm());
        return;
    }

    // Out of those left, which index matches our search term most closely?
    // For this application we want the title that is most similar to our search term, out of the top 10 results
    // Root words are usually pretty similar to their declensions so this should help
    var bestResult = 0;
    var bestDistance = 1000;
    for (let i = 0; i < results.length; i++) {
        const possibleTitle = results[i].title;
        const distance = Levenshtein.get(getSearchTerm(), possibleTitle);
        if (distance < bestDistance) {
            bestResult = i;
            bestDistance = distance;
        }
    }

    // Use the top result out of whatever are left
    const title = results[bestResult].title;
    const url = makeGetPageUrl(title, "handleDefinitionPage");
    updateStatusText(ST_DEFINITION + " " + title);
    runWiktionaryApi(url);
}

// We have the content of the definition page
// This _might_ contain the table we want directly.
// Often it's a short linker page "1. genitive singular of сло́во"
// In this case we want to follow that link.
function handleDefinitionPage(json) {
    const text = json.parse.text["*"];
    
    // Invoke Zalgo. The <center> cannot hold
    const decIndex = text.indexOf('Declension of <b lang="ru" class="Cyrl">');
    if (decIndex != -1) {
        // Plan A: We have a declension table right here
        const remainder = text.substring(decIndex);
        const tableStart = remainder.indexOf("<table");
        const tableEnd = remainder.indexOf("</table>");
        const tableHtml = remainder.substring(tableStart, tableEnd + 8);
        showDeclensionTable(json.parse.title, tableHtml);
        updateStatusText(ST_DONE);
    } else {
        // Plan B: Is this a form of a root word that is documented in another page?
        // Sometimes there are multiple... often they're different declensions the same root word
        // Just take the first one
        const redirects = text.match(/<span class="form-of-definition-link"><i class="Cyrl mention" lang="ru"><a href="\/wiki\/([^#]+)/);
        if (redirects && redirects.length > 0) {
            const url = makeGetPageUrl(redirects[1], "handleDefinitionPage");
            runWiktionaryApi(url);
        } else {
            // We have actually failed
            updateStatusText(ST_NOT_FOUND);
        }
    }
}

// We found the declensions table we're looking for. Take the HTML and show it to the user.
function showDeclensionTable(title, html) {
    // Strip all links
    html = html.replace(/<a[^>]*>/g, "");
    html = html.replace(/<\/a[^>]*>/g, "");

    // Put it on the page
    const r = document.getElementById("results");
    r.innerHTML = `<p>Wiktionary page: <a href="https://en.wiktionary.org/wiki/${title}#Russian">${title}</a></p>\n`;
    r.innerHTML += html;    
}

// If we fail provide a link to the raw search results
function showSearchResultLink(term) {
    document.getElementById("results").innerHTML = 
        `No declension table found: <a href="https://en.wiktionary.org/w/index.php?search=${term}">Wiktionary search</a>`;
}

function getSearchTerm() {
    return document.getElementById("search_term").value;
}

function updateStatusText(text) {
    document.getElementById("status").innerText = text;
}

function updatePageTitle(text) {
    document.title = `${text} - ${TITLE}`;
}

function makeSearchApiUrl(term, callback) {
    return `https://en.wiktionary.org/w/api.php?action=query&list=search&srsearch=${term}&srlimit=10&callback=${callback}&format=json`;
}

function makeGetPageUrl(title, callback) {
    return `https://en.wiktionary.org/w/api.php?action=parse&page=${title}&format=json&callback=${callback}`;
}

// Provided url should already have JSONP callback param set appropriately
// Avoiding CORS because it is a pain. I want this to work for a locally stored HTML file.
// Useful ref: https://www.mediawiki.org/wiki/API:Cross-site_requests
function runWiktionaryApi(url) {
    var script = document.createElement("script");
    script.src = url;
    document.head.appendChild(script);
}

function error() {
    updateStatusText(ST_ERROR);
}

function clearResults() {
    document.getElementById("results").innerHTML = "";
}




// Below this point is the Levenshtein calculation for most appropriate search result, which is MIT licensed.
// https://github.com/hiddentao/fast-levenshtein/

/* Copyright (c) 2013 Ramesh Nair

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

(function() {
    'use strict';
    
    var collator;
    try {
      collator = (typeof Intl !== "undefined" && typeof Intl.Collator !== "undefined") ? Intl.Collator("generic", { sensitivity: "base" }) : null;
    } catch (err){
      console.log("Collator could not be initialized and wouldn't be used");
    }
    // arrays to re-use
    var prevRow = [],
      str2Char = [];
    
    /**
     * Based on the algorithm at http://en.wikipedia.org/wiki/Levenshtein_distance.
     */
    var Levenshtein = {
      /**
       * Calculate levenshtein distance of the two strings.
       *
       * @param str1 String the first string.
       * @param str2 String the second string.
       * @param [options] Additional options.
       * @param [options.useCollator] Use `Intl.Collator` for locale-sensitive string comparison.
       * @return Integer the levenshtein distance (0 and above).
       */
      get: function(str1, str2, options) {
        var useCollator = (options && collator && options.useCollator);
        
        var str1Len = str1.length,
          str2Len = str2.length;
        
        // base cases
        if (str1Len === 0) return str2Len;
        if (str2Len === 0) return str1Len;
  
        // two rows
        var curCol, nextCol, i, j, tmp;
  
        // initialise previous row
        for (i=0; i<str2Len; ++i) {
          prevRow[i] = i;
          str2Char[i] = str2.charCodeAt(i);
        }
        prevRow[str2Len] = str2Len;
  
        var strCmp;
        if (useCollator) {
          // calculate current row distance from previous row using collator
          for (i = 0; i < str1Len; ++i) {
            nextCol = i + 1;
  
            for (j = 0; j < str2Len; ++j) {
              curCol = nextCol;
  
              // substution
              strCmp = 0 === collator.compare(str1.charAt(i), String.fromCharCode(str2Char[j]));
  
              nextCol = prevRow[j] + (strCmp ? 0 : 1);
  
              // insertion
              tmp = curCol + 1;
              if (nextCol > tmp) {
                nextCol = tmp;
              }
              // deletion
              tmp = prevRow[j + 1] + 1;
              if (nextCol > tmp) {
                nextCol = tmp;
              }
  
              // copy current col value into previous (in preparation for next iteration)
              prevRow[j] = curCol;
            }
  
            // copy last col value into previous (in preparation for next iteration)
            prevRow[j] = nextCol;
          }
        }
        else {
          // calculate current row distance from previous row without collator
          for (i = 0; i < str1Len; ++i) {
            nextCol = i + 1;
  
            for (j = 0; j < str2Len; ++j) {
              curCol = nextCol;
  
              // substution
              strCmp = str1.charCodeAt(i) === str2Char[j];
  
              nextCol = prevRow[j] + (strCmp ? 0 : 1);
  
              // insertion
              tmp = curCol + 1;
              if (nextCol > tmp) {
                nextCol = tmp;
              }
              // deletion
              tmp = prevRow[j + 1] + 1;
              if (nextCol > tmp) {
                nextCol = tmp;
              }
  
              // copy current col value into previous (in preparation for next iteration)
              prevRow[j] = curCol;
            }
  
            // copy last col value into previous (in preparation for next iteration)
            prevRow[j] = nextCol;
          }
        }
        return nextCol;
      }
  
    };
  
    // amd
    if (typeof define !== "undefined" && define !== null && define.amd) {
      define(function() {
        return Levenshtein;
      });
    }
    // commonjs
    else if (typeof module !== "undefined" && module !== null && typeof exports !== "undefined" && module.exports === exports) {
      module.exports = Levenshtein;
    }
    // web worker
    else if (typeof self !== "undefined" && typeof self.postMessage === 'function' && typeof self.importScripts === 'function') {
      self.Levenshtein = Levenshtein;
    }
    // browser main thread
    else if (typeof window !== "undefined" && window !== null) {
      window.Levenshtein = Levenshtein;
    }
  }());
