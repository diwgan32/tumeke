import { Reba } from '../lib/assessments/Reba';

test('expect Reba overall score text correctness', () => {
	let a = new Reba();
  expect(a.getRiskScoreInfo("Overall", 1)["ShortText"]).toBe("Acceptable");
  expect(a.getRiskScoreInfo("Overall", 2)["ShortText"]).toBe("Low");
  expect(a.getRiskScoreInfo("Overall", 3)["ShortText"]).toBe("Low");
  expect(a.getRiskScoreInfo("Overall", 4)["ShortText"]).toBe("Medium");
  expect(a.getRiskScoreInfo("Overall", 5)["ShortText"]).toBe("Medium");
  expect(a.getRiskScoreInfo("Overall", 6)["ShortText"]).toBe("Medium");
  expect(a.getRiskScoreInfo("Overall", 7)["ShortText"]).toBe("Medium");
  expect(a.getRiskScoreInfo("Overall", 8)["ShortText"]).toBe("High");
  expect(a.getRiskScoreInfo("Overall", 9)["ShortText"]).toBe("High");
  expect(a.getRiskScoreInfo("Overall", 10)["ShortText"]).toBe("High");
  expect(a.getRiskScoreInfo("Overall", 11)["ShortText"]).toBe("Very High");
  expect(a.getRiskScoreInfo("Overall", 12)["ShortText"]).toBe("Very High");

});

test('expect Reba text to score correctness', () => {
	expect(Reba.getRiskScoresFromLevel("Acceptable")).toStrictEqual([1]);
  expect(Reba.getRiskScoresFromLevel("Low")).toStrictEqual([2, 3]);
  expect(Reba.getRiskScoresFromLevel("Medium")).toStrictEqual([4, 5, 6, 7]);
  expect(Reba.getRiskScoresFromLevel("High")).toStrictEqual([8, 9, 10]);
  expect(Reba.getRiskScoresFromLevel("Very High")).toStrictEqual([11, 12, 13, 14, 15, 16]);
});