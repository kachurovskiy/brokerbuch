# brokerbuch

All-in-one HTML page app allowing to analyze broker transactions and calculate stuff like yearly gains and losses.

Currently just the Scalable Capital CSV transaction format is supported.

Use online at https://kachurovskiy.com/brokerbuch/

This software is provided "as is", without warranty of any kind. See [MIT LICENSE](LICENSE) for more info.

## Crypto

If you were selling crypto assets which are treated differently from shares by German tax code, make sure your crypto ISINs are listed in `src\processor.ts` for the separate gain/loss calculation.

## For developers

Use `npm run dev` for local runs, `npm test` to run tests and `npm run build` to build the `docs/index.html` all-in-one web app.
