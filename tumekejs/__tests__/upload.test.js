import { getPartsString } from '../lib/utils/upload';

test('expect parts string to work', () => {
  expect(getPartsString("1234", [{eTag: "something", partNum: 0}])).toStrictEqual("[{\"ETag\": \"something\", \"PartNumber\": 0}]");
});
