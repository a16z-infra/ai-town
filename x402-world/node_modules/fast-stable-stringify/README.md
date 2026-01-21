# fast-stable-stringify
*Notice: The License of this repository has been changed from GPL-3.0 to MIT as of 2017-08-25. All following commits will fall under the MIT license.*

[![Build Status](https://travis-ci.org/nickyout/fast-stable-stringify.svg?branch=master)](https://travis-ci.org/nickyout/fast-stable-stringify)
[![Sauce Test Status](https://saucelabs.com/browser-matrix/nickyout_fast-stable.svg)](https://saucelabs.com/u/nickyout_fast-stable)

_The test only succeeds when mine is faster than substack's in a particular browser._

The most popular repository providing this feature is [substack's json-stable-stringify][sub]. The intent if this library is to provide a faster alternative for when performance is more important than features. It assumes you provide basic javascript values without circular references, and returns a non-indented string.

It currently offers a performance boost in popular browsers of about 40%. See the comparsion table below.

Usage:

```javascript
var stringify = require('fast-stable-stringify');
stringify({ d: 0, c: 1, a: 2, b: 3, e: 4 }); // '{"a":2,"b":3,"c":1,"d":0,"e":4}'
```

Just like substack's, it does:

*   handle all variations of all basic javascript values (number, string, boolean, array, object, null, Date)
*   handle undefined _and_ function in the same way as `JSON.stringify`
*   **not support ie8 (and below) with complete certainty**.

Unlike substack's, it does:

*   not implement the 'replacer' or 'space' arguments of the JSON.stringify method
*   not check for circular references

## Test results
Tested validity (answer equal to substack's) and benchmark (faster than substack's). A test passes only if it has the same output as substack's but is faster (as concluded by [benchmark.js][ben]). 

To (hopefully) prevent [certain smart browsers][cat] from concluding the stringification is not necessary because it is never used anywhere, I summed up all the lengths of the resulting strings of each benchmark contestant and printed it along with the result data. 

### Latest interpreted result

See [caniuse browser usage][usg] for the 'most popular browsers'.

| Suite | Browser                                 | JSON.stringify@native | fast-stable-stringify@a9f81e8 | json-stable-stringify@1.0.1 | faster-stable-stringify@1.0.0 |
| :---- | :-------------------------------------- | --------------------: | ----------------------------: | --------------------------: | ----------------------------: |
| libs  | Chrome 60.0.3112 (Windows 7 0.0.0)      |      414.45% (±2.67%) |             *146.41% (±1.74%) |            100.00% (±1.11%) |              111.26% (±1.24%) |
| libs  | Chrome Mobile 55.0.2883 (Android 6.0.0) |      495.16% (±16.9%) |             *162.18% (±3.59%) |            100.00% (±5.44%) |              129.66% (±3.20%) |
| libs  | Edge 14.14393.0 (Windows 10 0.0.0)      |      487.88% (±11.9%) |             *138.69% (±2.27%) |            100.00% (±1.51%) |              113.19% (±1.56%) |
| libs  | Firefox 54.0.0 (Windows 7 0.0.0)        |      530.66% (±17.6%) |             *169.34% (±2.38%) |            100.00% (±1.68%) |              152.30% (±2.48%) |
| libs  | IE 10.0.0 (Windows 7 0.0.0)             |      427.80% (±10.9%) |             *183.26% (±3.02%) |            100.00% (±2.42%) |                             ? |
| libs  | IE 11.0.0 (Windows 7 0.0.0)             |      298.01% (±4.35%) |             *136.25% (±1.89%) |            100.00% (±1.73%) |                             ? |
| libs  | IE 9.0.0 (Windows 7 0.0.0)              |      316.18% (±4.01%) |             *170.14% (±2.30%) |            100.00% (±1.52%) |                             ? |
| libs  | Mobile Safari 10.0.0 (iOS 10.3.0)       |      554.98% (±23.7%) |             *115.33% (±4.23%) |            100.00% (±3.11%) |             *118.66% (±2.96%) |
| libs  | Safari 10.0.1 (Mac OS X 10.12.1)        |      722.94% (±24.8%) |             *119.49% (±3.62%) |            100.00% (±2.12%) |              106.06% (±3.12%) |

Click the build status badge to view the original output.

Disclaimer: the more I test the more I realize how many factors actually affect the outcome. Not only the browser and browser version, but particularly the json content and a random factor in every test run. Outcomes may sometimes vary more than 10% between tests, despite my attempt to reduce this by increasing the sample size to 2.5 times. Nevertheless, the overall picture typically still holds.

`JSON.stringify` has been added for reference. In general, aside from the cases where you need the guarantee of a stable result, I would recommend against using this library, or any stable stringification library for that matter.

[`faster-stable-stringify`][fss] has been added for comparison. It seems it does not work in IE 9 to 11 without a polyfill solution for WeakMap. It is displayed as somewhat slower, but as I decided on the JSON input to test and develop against, this result may be somewhat biased. In some test runs, [`faster-stable-stringify`][fss] will be faster in a browser. In fact, it is consistently somewhat faster in the Mobile Safari 10.

## Note about string escaping
The original implementation was with regexp. A pull request showed a literal string approach that was faster in some browsers. Other libraries would just use JSON.stringify. After a speed comparison between all three methods, it became clear that native JSON.stringify is generally much faster in string escaping than both these methods, even in the IE legacy browsers. The browsers that do not have `JSON.stringify` are not offered for test automation, and when looking at the [usage percentage][usg] of such browsers I no longer see a reason to not use `JSON.stringify`.

Therefore, the exposed regexp and string are removed from the API. If you still need this functionality, I simply encourage you to use `JSON.stringify`.

## Running tests
It runs karma-benchmark tests now. For testing in node, do:

```
npm test
```

This requires [saucelabs credentials in your env][env]. That, or edit the karma.conf.js to your liking.

Running this test will cause files in `./results/libs/` to update. Run `npm run table` to get a pretty md table of the results.

[sub]: https://github.com/substack/json-stable-stringify
[ben]: https://github.com/bestiejs/benchmark.js
[cat]: http://mrale.ph/blog/2014/02/23/the-black-cat-of-microbenchmarks.html
[usg]: http://caniuse.com/usage-table
[env]: https://wiki.saucelabs.com/display/DOCS/Best+Practice%3A+Use+Environment+Variables+for+Authentication+Credentials
[fss]: https://github.com/ppaskaris/faster-stable-stringify