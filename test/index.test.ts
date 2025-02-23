import { expect, test, describe } from "vitest";
import { extractRelevantData } from "../src/index";
import { GL } from "../src/types";
describe("extractRelevantData", () => {
    test("should extract primitive types from a shader", () => {
        const source = `
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec3 u_color;
            uniform vec4 u_position;
        `;
        const result = extractRelevantData(source);
        expect(result).toMatchSnapshot();
    });
    test("should extract structs from a shader", () => {
        let source = `
        struct Light {
            vec3 position;
            vec3 color;
        };
        uniform Light u_light;
  `;
        const result = extractRelevantData(source);
        expect(result).toMatchSnapshot();
    });
    test.only("should extract structs from a shader", () => {
        const source = `
        struct Light {
            vec3 position;
            vec3 color;
        };
        uniform Light u_light[3];
  `;
        const nestedLight = new Map([
            ["color", GL.Uniform.Data.inferBasicData("vec3")],
            ["position", GL.Uniform.Data.inferBasicData("vec3")],
        ]);
        const expectedUniformsData: GL.Uniform.Data.Scope = new Map([
            ["u_light", [
                nestedLight,
                nestedLight,
                nestedLight,
            ]],
        ]);
        const result = extractRelevantData(source);
        console.log(result);
        expect(result.uniformsData).toEqual(expectedUniformsData);
    });
});
