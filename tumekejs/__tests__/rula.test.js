import { Rula } from '../lib/assessments/Rula';

test('expect Rula overall score text correctness', () => {
	let a = new Rula();
  expect(a.getRiskScoreInfo("Overall", 1)["ShortText"]).toBe("Acceptable");
  expect(a.getRiskScoreInfo("Overall", 2)["ShortText"]).toBe("Acceptable");
  expect(a.getRiskScoreInfo("Overall", 3)["ShortText"]).toBe("Low");
  expect(a.getRiskScoreInfo("Overall", 4)["ShortText"]).toBe("Low");
  expect(a.getRiskScoreInfo("Overall", 5)["ShortText"]).toBe("Medium");
  expect(a.getRiskScoreInfo("Overall", 6)["ShortText"]).toBe("Medium");
  expect(a.getRiskScoreInfo("Overall", 7)["ShortText"]).toBe("High");
});

test('expect Rula text to score correctness', () => {
	expect(Rula.getRiskScoresFromLevel("Acceptable")).toStrictEqual([1, 2]);
  expect(Rula.getRiskScoresFromLevel("Low")).toStrictEqual([3, 4]);
  expect(Rula.getRiskScoresFromLevel("Medium")).toStrictEqual([5, 6]);
  expect(Rula.getRiskScoresFromLevel("High")).toStrictEqual([7]);
});