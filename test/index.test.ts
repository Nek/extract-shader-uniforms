import { assert, describe, it, snapshot, test } from 'vitest';
import { extractShaderUniforms } from '../src/index';

test("extractShaderUniforms", () => {
  console.log(extractShaderUniforms(''));
  expect(extractShaderUniforms('')).toMatchSnapshot();
});
