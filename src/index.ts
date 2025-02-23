import { parser, generate } from "@shaderfrog/glsl-parser";
import { visit, type NodeVisitors } from "@shaderfrog/glsl-parser/ast";
import { GL } from "./types";

const { tagStructName, inferSize, inferStructNameOrBasicDef } = GL.Uniform.Defs;

export function extractRelevantData(source: string) {
    let ast = parser.parse(source);
    const newSource = generate(ast);
    ast = parser.parse(newSource);

    const uniformDefs: GL.Uniform.Defs.Struct = {};
    const uniformsData: GL.Uniform.Data.Scope = {};
    const structDefs: Record<string, GL.Uniform.Defs.Struct> = {};
    const structsData: Record<string, GL.Uniform.Data.Scope> = {};

    const structVisitors: NodeVisitors = {
        fully_specified_type: {
            enter: path => {
                if (path.node.specifier.specifier.type === "struct") {
                    const name = path.node.specifier.specifier.typeName.identifier;
                    const def: GL.Uniform.Defs.Struct = {};
                    const data: GL.Uniform.Data.Scope = {};
                    for (const declaration of path.node.specifier.specifier.declarations) {
                        let structPropId: string | undefined;
                        let structPropType: string | undefined;
                        if (declaration.declaration.specified_type.specifier.specifier.type === "type_name") {
                            structPropType = declaration.declaration.specified_type.specifier.specifier.identifier;
                            structPropId = declaration.declaration.declarations[0].identifier.identifier;
                        } else if (declaration.declaration.specified_type.specifier.specifier.type === "keyword") {
                            structPropType = declaration.declaration.specified_type.specifier.specifier.token;
                            structPropId = declaration.declaration.declarations[0].identifier.identifier;
                        }
                        if (structPropId && structPropType) {
                            def[structPropId] = inferStructNameOrBasicDef(structPropType);
                            if (GL.Uniform.Data.isBasicData(structPropType)) {
                                data[structPropId] = structPropType;
                            } else {
                                try {
                                    const nestedStruct = structsData[structPropType];
                                    if (nestedStruct) {
                                        data[structPropId] = nestedStruct;
                                    }
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                        }
                    }
                    structDefs[name] = def;
                    structsData[name] = data;
                }
            },
        },
    };

    const uniformVisitors: NodeVisitors = {
        fully_specified_type: {
            enter: path => {
                if (path.node.qualifiers?.[0]?.type === "keyword" && path.node.qualifiers?.[0]?.token === "uniform") {
                    const quantifiers = path.parentPath?.node.declarations[0].quantifier;

                    const arrayQuantifiers: [number] | [number, number] | number[] = [];
                    if (quantifiers?.length) {
                        for (const q of quantifiers) {
                            if (q.expression.type === "int_constant") {
                                const quantifier = parseInt(q.expression.token, 10);
                                if (quantifier > 1) {
                                    arrayQuantifiers.push(quantifier);
                                }
                            }
                        }
                    }
                    const typeSpecifierType = path.node.specifier.specifier.type;
                    let uniformType = null;
                    switch (typeSpecifierType) {
                        case "type_name":
                            uniformType = path.node.specifier.specifier.identifier;
                            break;
                        case "keyword":
                            uniformType = path.node.specifier.specifier.token;
                            break;
                        default:
                            return;
                    }

                    const uniformName = path.parentPath?.node.declarations[0].identifier.identifier;
                    if (!uniformsData[uniformName]) {
                        if (GL.Uniform.Data.isBasicData(uniformType)) {
                            if (arrayQuantifiers.length) {
                                let arr;
                                if (arrayQuantifiers.length === 1) {
                                    arr = Array(arrayQuantifiers[0]).fill(uniformType);
                                } else {
                                    const nested = Array(arrayQuantifiers[1]).fill(uniformType);
                                    arr = Array(arrayQuantifiers[0]).map(() => [...nested]);
                                }
                                uniformsData[uniformName] = arr;
                                uniformDefs[uniformName] = GL.Uniform.Defs.inferArrayDef({
                                    type: uniformType,
                                    size: inferSize(arrayQuantifiers),
                                });
                            } else {
                                uniformsData[uniformName] = uniformType;
                                uniformDefs[uniformName] = uniformType;
                            }
                        } else {
                            try {
                                const nestedStruct = structsData[uniformType];
                                if (nestedStruct) {
                                    if (arrayQuantifiers.length) {
                                        let arr;
                                        if (arrayQuantifiers.length === 1) {
                                            arr = Array(arrayQuantifiers[0]).fill(nestedStruct);
                                        } else {
                                            const nested = Array(arrayQuantifiers[1]).fill(nestedStruct);
                                            arr = Array(arrayQuantifiers[0]).fill(nested);
                                        }
                                        uniformsData[uniformName] = arr;
                                        uniformDefs[uniformName] = GL.Uniform.Defs.inferArrayDef({
                                            type: tagStructName(uniformType),
                                            size: inferSize(arrayQuantifiers),
                                        });
                                    } else {
                                        uniformsData[uniformName] = nestedStruct;
                                        uniformDefs[uniformName] = tagStructName(uniformType);
                                    }
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                }
            },
        },
    };

    visit(ast, structVisitors);
    visit(ast, uniformVisitors);

    return {
        structDefs,
        structsData,
        uniformDefs,
        uniformsData,
    };
}
