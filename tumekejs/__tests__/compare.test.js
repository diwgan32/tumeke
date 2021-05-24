import { getChartDataForVideo, getCompareObject } from '../lib/utils/compare';
import { videoObj1, videoObj2 } from './constants';

test('expect basic compare helper', () => {
  const data = {
    "1": 14.9,
    "2": 22.4,
    "3": 46.3,
    "4": 10.9,
    "5": 3.6,
    "6": .8,
    "7": .8
  };
  const colors = {
    "1": "rgba(109, 208, 163, 1.0)",
    "2": "rgba(109, 208, 163, 1.0)",
    "3": "rgba(20, 210, 184, 1.0)",
    "4": "rgba(20, 210, 184, 1.0)",
    "5": "rgba(234, 130, 130, 1.0)",
    "6": "rgba(234, 130, 130, 1.0)",
    "7": "rgba(184, 15, 10, 1.0)"
  }
  expect(getChartDataForVideo(videoObj1, "0", "Overall")).toStrictEqual({
    data: data,
    colors: colors,
    videoId: videoObj1.key
  });
});

test('expect basic low detail table correctness', () => {
  const data = {
    "Acceptable": 37.4,
    "Low": 57.3,
    "Medium": 4.4,
    "High": .8
  };
  const colors = {
    "Acceptable": "rgba(109, 208, 163, 1.0)",
    "Low": "rgba(20, 210, 184, 1.0)",
    "Medium": "rgba(234, 130, 130, 1.0)",
    "High": "rgba(184, 15, 10, 1.0)"
  }
  expect(getChartDataForVideo(videoObj1, "0", "Overall", false)).toStrictEqual({
    data: data,
    colors: colors,
    videoId: videoObj1.key
  });
});

test('expect missing compare helper', () => {
  const data = {
    "1": 26.7,
    "2": 21.6,
    "3": 17.9,
    "4": 0.0,
    "Not Identified": 33.6
  }
  const colors = {
    "1": "rgba(109, 208, 163, 1.0)",
    "2": "rgba(20, 210, 184, 1.0)",
    "3": "rgba(234, 130, 130, 1.0)",
    "4": "rgba(184, 15, 10, 1.0)",
    "Not Identified": '#6c7b8a'
  }

  expect(getChartDataForVideo(videoObj1, "0", "Wrist")).toStrictEqual({
    data: data,
    colors: colors,
    videoId: videoObj1.key
  });
});

test('expect overall compare correctness', () => {
  const videoDatas = [videoObj1];
  expect(getCompareObject(videoDatas)).toStrictEqual(
    {
      "Overall": [
        {
          "videoId": "8fe410e0-d38a-4670-bd8a-0ff038f56170",
          "data": {
            "1": 14.9,
            "2": 22.4,
            "3": 46.3,
            "4": 10.9,
            "5": 3.6,
            "6": 0.8,
            "7": 0.8
          },
          "colors": {
            "1": "rgba(109, 208, 163, 1.0)",
            "2": "rgba(109, 208, 163, 1.0)",
            "3": "rgba(20, 210, 184, 1.0)",
            "4": "rgba(20, 210, 184, 1.0)",
            "5": "rgba(234, 130, 130, 1.0)",
            "6": "rgba(234, 130, 130, 1.0)",
            "7": "rgba(184, 15, 10, 1.0)"
          }
        }
      ],
      "Leg": [],
      "Lower Arm": [
        {
          "videoId": "8fe410e0-d38a-4670-bd8a-0ff038f56170",
          "data": {
            "1": 70.8,
            "2": 28.1,
            "3": 0.9,
            "Not Identified": 0
          },
          "colors": {
            "1": "rgba(20, 210, 184, 1.0)",
            "2": "rgba(234, 130, 130, 1.0)",
            "3": "rgba(184, 15, 10, 1.0)",
            "Not Identified": "#6c7b8a"
          }
        }
      ],
      "Upper Arm": [
        {
          "videoId": "8fe410e0-d38a-4670-bd8a-0ff038f56170",
          "data": {
            "1": 27.2,
            "2": 47.7,
            "3": 13.4,
            "4": 11.5,
            "5": 0,
            "6": 0,
            "Not Identified": 0
          },
          "colors": {
            "1": "rgba(109, 208, 163, 1.0)",
            "2": "rgba(20, 210, 184, 1.0)",
            "3": "rgba(234, 130, 130, 1.0)",
            "4": "rgba(234, 130, 130, 1.0)",
            "5": "rgba(184, 15, 10, 1.0)",
            "6": "rgba(184, 15, 10, 1.0)",
            "Not Identified": "#6c7b8a"
          }
        }
      ],
      "Neck": [
        {
          "videoId": "8fe410e0-d38a-4670-bd8a-0ff038f56170",
          "data": {
            "1": 68.4,
            "2": 19.5,
            "3": 9.4,
            "4": 2.5,
            "5": 0,
            "6": 0,
            "Not Identified": 0
          },
          "colors": {
            "1": "rgba(109, 208, 163, 1.0)",
            "2": "rgba(20, 210, 184, 1.0)",
            "3": "rgba(234, 130, 130, 1.0)",
            "4": "rgba(234, 130, 130, 1.0)",
            "5": "rgba(184, 15, 10, 1.0)",
            "6": "rgba(184, 15, 10, 1.0)",
            "Not Identified": "#6c7b8a"
          }
        }
      ],
      "Trunk": [
        {
          "videoId": "8fe410e0-d38a-4670-bd8a-0ff038f56170",
          "data": {
            "1": 53.5,
            "2": 26.1,
            "3": 15.1,
            "4": 4.8,
            "5": 0.2,
            "6": 0.0,
            "Not Identified": 0.0
          },
          "colors": {
            "1": "rgba(109, 208, 163, 1.0)",
            "2": "rgba(20, 210, 184, 1.0)",
            "3": "rgba(234, 130, 130, 1.0)",
            "4": "rgba(234, 130, 130, 1.0)",
            "5": "rgba(184, 15, 10, 1.0)",
            "6": "rgba(184, 15, 10, 1.0)",
            "Not Identified": "#6c7b8a"
          }
        }
      ],
      "Wrist": [
        {
          "videoId": "8fe410e0-d38a-4670-bd8a-0ff038f56170",
          "data": {
            "1": 26.7,
            "2": 21.6,
            "3": 17.9,
            "4": 0,
            "Not Identified": 33.6
          },
          "colors": {
            "1": "rgba(109, 208, 163, 1.0)",
            "2": "rgba(20, 210, 184, 1.0)",
            "3": "rgba(234, 130, 130, 1.0)",
            "4": "rgba(184, 15, 10, 1.0)",
            "Not Identified": "#6c7b8a"
          }
        }
      ]
    }
  );
});