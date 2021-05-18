import { Niosh } from '../lib/';

test('expect NIOSH overall score text correctness', () => {
	let a = new Niosh();
  expect(a.getRiskScoreInfo("li", -1)["ShortText"]).toBe("Missing average load");
  expect(a.getRiskScoreInfo("li", 1)["ShortText"]).toBe("Good");
  expect(a.getRiskScoreInfo("li", 1.5)["ShortText"]).toBe("Good");
  expect(a.getRiskScoreInfo("li", 2)["ShortText"]).toBe("Fair");
  expect(a.getRiskScoreInfo("li", 3)["ShortText"]).toBe("Poor");
});