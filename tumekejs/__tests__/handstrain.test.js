import { HandStrain } from '../lib/';

test('expect HandStrain overall score text correctness', () => {
	let a = new HandStrain();
  expect(a.getRiskScoreInfo("resultLeft", 1)["ShortText"]).toBe("Good");
  expect(a.getRiskScoreInfo("resultLeft", 10)["ShortText"]).toBe("Poor");
});