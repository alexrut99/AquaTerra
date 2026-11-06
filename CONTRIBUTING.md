# Contributing to AquaTerra

ยินดีรับการมีส่วนร่วมครับ ทั้งแจ้งบั๊ก เสนอฟีเจอร์ และส่งโค้ด / Bug reports, ideas and pull requests are all welcome.

1. Fork the repository, make a branch, and open a pull request.
2. The whole app is `web/index.html`. Open it in a browser, or run `npm start` for the desktop window.
3. Run the tests before sending: `npm ci && npx playwright install chromium && npm test`.

## Changing a calculation

A wrong number is the worst bug this program can have, so:

- Add or update a check in `tests/acceptance.js` with an answer computed **independently of the app**, as in `tests/ref/` (SciPy, mpmath).
- Say in the pull request which textbook or paper the formula comes from.

By sending a contribution you agree it is licensed under the [Apache License 2.0](LICENSE).
