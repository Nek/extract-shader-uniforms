const Scalar = {
    bool: "bool",
    int: "int",
    uint: "uint",
    float: "float",
} as const;

const Vector = {
    vec2: "vec2",
    vec3: "vec3",
    vec4: "vec4",
    bvec2: "bvec2",
    bvec3: "bvec3",
    bvec4: "bvec4",
    ivec2: "ivec2",
    ivec3: "ivec3",
    ivec4: "ivec4",
    uvec2: "uvec2",
    uvec3: "uvec3",
    uvec4: "uvec4",
} as const;

const Matrix = {
    mat2: "mat2",
    mat3: "mat3",
    mat4: "mat4",
    mat2x2: "mat2x2",
    mat2x3: "mat2x3",
    mat2x4: "mat2x4",
    mat3x2: "mat3x2",
    mat3x3: "mat3x3",
    mat3x4: "mat3x4",
    mat4x2: "mat4x2",
    mat4x3: "mat4x3",
    mat4x4: "mat4x4",
} as const;

const Sampler = {
    sampler2D: "sampler2D",
    sampler3D: "sampler3D",
    samplerCube: "samplerCube",
    sampler2DArray: "sampler2DArray",
    samplerCubeShadow: "samplerCubeShadow",
    sampler2DShadow: "sampler2DShadow",
    sampler2DArrayShadow: "sampler2DArrayShadow",
    isampler2D: "isampler2D",
    isampler3D: "isampler3D",
    isamplerCube: "isamplerCube",
    isampler2DArray: "isampler2DArray",
    usampler2D: "usampler2D",
    usampler3D: "usampler3D",
    usamplerCube: "usamplerCube",
    usampler2DArray: "usampler2DArray",
} as const;

export namespace GL {
    enum SplDimension {
        _2D = "2D",
        _3D = "3D",
        _Cube = "Cube",
        _2DArray = "2DArray",
        _CubeShadow = "CubeShadow",
        _2DShadow = "2DShadow",
        _2DArrayShadow = "2DArrayShadow",
    }

    enum Scl {
        Bool = "bool",
        Int = "int",
        Uint = "uint",
        Float = "float",
    }

    type Pre<T extends Scl> = T extends Scl.Bool ? "b" : T extends Scl.Int ? "i" : T extends Scl.Uint ? "u" : "";

    type Spl<T extends Scl, D extends SplDimension> = T extends Scl.Float
        ? `sampler${D}`
        : T extends Scl.Int | Scl.Uint
          ? D extends SplDimension._CubeShadow | SplDimension._2DShadow | SplDimension._2DArrayShadow
              ? never
              : `${Pre<T>}sampler${D}`
          : never;

    type Vec<T extends Scl, N extends 2 | 3 | 4> = `${Pre<T>}vec${N}`;
    type MatCols = 2 | 3 | 4;
    type MatRows = 2 | 3 | 4 | undefined;
    type Mat<COL extends MatCols, ROW extends MatRows> = ROW extends undefined ? `mat${COL}` : `mat${COL}x${ROW}`;

    type Prp = Emb | Arr<Emb, number, number | undefined>;

    type StcDef = {
        [propName: string]: Prp;
    };
    type StcName = string & { __isStcName: true };
    type StcsDict = Record<StcName, StcDef>;

    type Emb = StcName | Scl | Spl<Scl, SplDimension> | Vec<Scl, 2 | 3 | 4> | Mat<MatCols, MatRows>;

    type Arr<T extends Emb, X extends number, Y extends number | undefined> = (Y extends undefined
        ? `[${X}]`
        : `[${X}, ${Y}]`) & { __isArr: true; __type: T };

    export namespace Uniform {
        export namespace Data {
            export const Basic = {
                ...Scalar,
                ...Vector,
                ...Matrix,
                ...Sampler,
            } as const;

            export type Basic = keyof typeof Basic;

            export function isBasicData(type: any): type is Basic {
                return Object.values(Basic).includes(type as Basic);
            }

            export function inferBasicData(type: any): Basic {
                if (isBasicData(type)) {
                    return type;
                }
                throw new Error(`Invalid type: ${type}`);
            }

            export interface Scope {
                [key: string]: keyof typeof Basic | Scope | Array1<keyof typeof Basic | Scope, number> | Array2<keyof typeof Basic | Scope, number, number>;
            }

            export type Array1<T extends keyof typeof Basic | Scope, N extends number> = {
                [index: number]: T;
                length: N;
            };

            export type Array2<T extends keyof typeof Basic | Scope, N extends number, M extends number> = {
                [index: number]: Array1<T, M>;
                length: N;
            };

            export const Setters = {
                [Basic.bool]: "uniform1i",
                [Basic.int]: "uniform1i",
                [Basic.uint]: "uniform1ui",
                [Basic.float]: "uniform1f",
                [Basic.vec2]: "uniform2f",
                [Basic.vec3]: "uniform3f",
                [Basic.vec4]: "uniform4f",
                [Basic.bvec2]: "uniform2i",
                [Basic.bvec3]: "uniform3i",
                [Basic.bvec4]: "uniform4i",
                [Basic.ivec2]: "uniform2i",
                [Basic.ivec3]: "uniform3i",
                [Basic.ivec4]: "uniform4i",
                [Basic.uvec2]: "uniform2ui",
                [Basic.uvec3]: "uniform3ui",
                [Basic.uvec4]: "uniform4ui",
                [Basic.mat2]: "uniformMatrix2fv",
                [Basic.mat3]: "uniformMatrix3fv",
                [Basic.mat4]: "uniformMatrix4fv",
                [Basic.mat2x2]: "uniformMatrix2fv",
                [Basic.mat2x3]: "uniformMatrix2fv",
                [Basic.mat2x4]: "uniformMatrix2fv",
                [Basic.mat3x2]: "uniformMatrix3fv",
                [Basic.mat3x3]: "uniformMatrix3fv",
                [Basic.mat3x4]: "uniformMatrix3fv",
                [Basic.mat4x2]: "uniformMatrix4fv",
                [Basic.mat4x3]: "uniformMatrix4fv",
                [Basic.mat4x4]: "uniformMatrix4fv",
                [Basic.sampler2D]: "uniform1i",
                [Basic.sampler3D]: "uniform1i",
                [Basic.samplerCube]: "uniform1i",
                [Basic.sampler2DArray]: "uniform1i",
                [Basic.samplerCubeShadow]: "uniform1i",
                [Basic.sampler2DShadow]: "uniform1i",
                [Basic.sampler2DArrayShadow]: "uniform1i",
                [Basic.isampler2D]: "uniform1i",
                [Basic.isampler3D]: "uniform1i",
                [Basic.isamplerCube]: "uniform1i",
                [Basic.isampler2DArray]: "uniform1i",
                [Basic.usampler2D]: "uniform1ui",
                [Basic.usampler3D]: "uniform1ui",
                [Basic.usamplerCube]: "uniform1ui",
                [Basic.usampler2DArray]: "uniform1ui",
            } as const;
        }
        export namespace Defs {
            export const Basic = {
                ...Scalar,
                ...Vector,
                ...Matrix,
                ...Sampler,
            } as const;

            interface StructName extends String {
            }

            export type Basic = keyof typeof Basic;      

            export interface Array {
                type: Basic | StructName;
                size: [number] | [number, number];
            }

            export function tagStructName<T extends string>(name: T): StructName {
                if (isStructName(name)) {
                    return name;
                }
                throw new Error(`Invalid StructName: ${name}`);
            }

            export function isStructName(type: any): type is StructName {
                return typeof type === 'string' && type.length > 0;
            }

            export function isArray(type: { type: Basic | StructName, size: Size }): type is Array {
                if (!isBasicDef(type?.type) && !isStructName(type?.type)) {
                    return false;
                }
                if (!isSize(type?.size)) {
                    return false;
                }
                return true;
            }

            export type Size = [number] | [number, number];

            export function isSize(type: any): type is Size {
                if (Array.isArray(type) && type.length === 1 && typeof type[0] === "number" && Number.isInteger(type[0]) && type[0] > 1) {
                    return true;
                }
                if (Array.isArray(type) && type.length === 2 && typeof type[0] === "number" && typeof type[1] === "number" && Number.isInteger(type[0]) && Number.isInteger(type[1]) && type[0] > 1 && type[1] > 1) {
                    return true;
                }
                return false;
            }

            export function inferSize(type: any): Size {
                if (isSize(type)) {
                    return type;
                }
                throw new Error(`Invalid Size: ${type}`);
            }

            export function inferArrayDef(type: { type: Basic | StructName, size: Size }): Array {
                if (isArray(type)) {
                    return type;
                }
                throw new Error(`Invalid Array: ${type}`);
            }
            export interface Struct {
                [key: string]: Basic | Array | StructName;
            }
        
            export function isBasicDef(type: any): type is Basic {
                return Object.values(Basic).includes(type as Basic);
            }

            export function inferBasicDef(type: any): Basic {
                if (isBasicDef(type)) {
                    return type;
                }
                throw new Error(`Invalid Basic: ${type}`);
            }

            export function inferStructNameOrBasicDef(type: any): StructName | Basic {
                if (isStructName(type)) {
                    return type;
                }
                if (isBasicDef(type)) {
                    return type;
                }
                throw new Error(`Neither StructName nor BasicDef: ${type}`);
            }

            export function isStructDef(type: any): type is Struct {
                if (typeof type === 'object' && type !== null && !Array.isArray(type)) {
                    for (const value of Object.values(type as Struct)) {
                        if (!isBasicDef(value) && !isStructName(value) && !isArray(value)) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            }

            export function inferStructDef(type: any): Struct {
                if (isStructDef(type)) {
                    return type;
                }
                throw new Error(`Invalid StructDef: ${type}`);
            }
        }
    }
}
