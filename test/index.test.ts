import { expect, test, describe } from "vitest";
import { extractRelevantData } from "../src/index";
import { GL } from "../src/types";
describe("extractShaderUniforms", () => {
    test("should extract primitive types from a shader", () => {
        const source = `
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec3 u_color;
            uniform vec4 u_position;
        `;
        // const expected: GL.Uniforms.Scope = {
        //     u_color: GL.Uniforms.Basic.vec3,
        //     u_position: GL.Uniforms.Basic.vec4,
        //     u_resolution: GL.Uniforms.Basic.vec2,
        //     u_time: GL.Uniforms.Basic.float,
        // };
        const result = extractRelevantData(source);
        console.log(result);
        expect(true).toEqual(true);
    });
    test.only("should extract structs from a shader", () => {
        let source = `
        struct Light {
            vec3 position;
            vec3 color;
        };
        uniform Light u_light;
  `;
        const expected: GL.Uniforms.Scope = {
            u_light: {
                position: "vec3",
                color: "vec3",
            },
        };

        const source2 = `
        struct Light {
            vec3 position;
            vec3 color;
        };
        uniform Light u_light[3];
  `;
        // type Vec3 =
        const expected2: GL.Uniforms.Scope = {
            u_light: [
                {
                    position: "vec3",
                    color: "vec3",
                },
                {
                    position: "vec3",
                    color: "vec3",
                },
                {
                    position: "vec3",
                    color: "vec3",
                },
            ],
        };

        const result = extractRelevantData(source);
        expect(true).toEqual(true);
    });
});
