// export enum GLType {
//     Bool = "bool",
//     Int = "int",
//     Uint = "uint",
//     Float = "float",
//     Vec2 = "vec2",
//     Vec3 = "vec3",
//     Vec4 = "vec4",
//     // Bvec2 = 'bvec2', Not directly settable in WebGL
//     // Bvec3 = 'bvec3', Converts to ivec3 in JavaScript
//     // Bvec4 = 'bvec4', Converts to ivec4 in JavaScript
//     Ivec2 = "ivec2",
//     Ivec3 = "ivec3",
//     Ivec4 = "ivec4",
//     Uvec2 = "uvec2",
//     Uvec3 = "uvec3",
//     Uvec4 = "uvec4",
//     Mat2 = "mat2",
//     Mat3 = "mat3",
//     Mat4 = "mat4",
//     Mat2x2 = "mat2x2",
//     Mat2x3 = "mat2x3",
//     Mat2x4 = "mat2x4",
//     Mat3x2 = "mat3x2",
//     Mat3x3 = "mat3x3",
//     Mat3x4 = "mat3x4",
//     Mat4x2 = "mat4x2",
//     Mat4x3 = "mat4x3",
//     Mat4x4 = "mat4x4",
//     Sampler2D = "sampler2D",
//     Sampler3D = "sampler3D",
//     SamplerCube = "samplerCube",
//     Sampler2DArray = "sampler2DArray",
//     SamplerCubeShadow = "samplerCubeShadow",
//     Sampler2DShadow = "sampler2DShadow",
//     Sampler2DArrayShadow = "sampler2DArrayShadow",
//     Isampler2D = "isampler2D",
//     Isampler3D = "isampler3D",
//     IsamplerCube = "isamplerCube",
//     Isampler2DArray = "isampler2DArray",
//     Usampler2D = "usampler2D",
//     Usampler3D = "usampler3D",
//     UsamplerCube = "usamplerCube",
//     Usampler2DArray = "usampler2DArray",
// }

enum GLSamplerDimension {
    _2D = "2D",
    _3D = "3D",
    _Cube = "Cube",
    _2DArray = "2DArray",
    _CubeShadow = "CubeShadow",
    _2DShadow = "2DShadow",
    _2DArrayShadow = "2DArrayShadow",
}

enum GLPrim {
    Bool = "b",
    Int = "i",
    Uint = "u",
    Float = "",
}

type GLSampler<T extends GLPrim, D extends GLSamplerDimension> = T extends GLPrim.Float
    ? `sampler${D}`
    : T extends GLPrim.Int | GLPrim.Uint
      ? D extends GLSamplerDimension._CubeShadow | GLSamplerDimension._2DShadow | GLSamplerDimension._2DArrayShadow
          ? never
          : `${T}sampler${D}`
      : never;

type GLVec<T extends GLPrim, N extends 2 | 3 | 4> = `${T}vec${N}`;
type MatCols = 2 | 3 | 4;
type MatRows = 2 | 3 | 4 | undefined;
type GLMat<COL extends MatCols, ROW extends MatRows> = ROW extends undefined ? `mat${COL}` : `mat${COL}x${ROW}`;

type GLPropType = Embeddable | GLArray<Embeddable, number, number | undefined>;

type GLPropName = string & { __isPropName: true };
type GLStructDef = Record<GLPropName, GLPropType>;
type GLStructName = string & { __isStructName: true };
type GLStructsDict = Record<GLStructName, GLStructDef>;

type Embeddable =
    | GLStructName
    | GLPrim
    | GLSampler<GLPrim, GLSamplerDimension>
    | GLVec<GLPrim, 2 | 3 | 4>
    | GLMat<MatCols, MatRows>;

type GLArray<T extends Embeddable, X extends number, Y extends number | undefined> = (Y extends undefined
    ? `[${X}]`
    : `[${X}, ${Y}]`) & { __isArray: true; __type: T };

type UniformsDict = Record<string & { __isUniformId: true }, GLPropType>;

type Concrete = GLArray<GLPrim.Float, 1, 1>;
