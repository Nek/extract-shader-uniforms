import { parser, generate } from "@shaderfrog/glsl-parser";
import { visit, type NodeVisitors } from "@shaderfrog/glsl-parser/ast";
import { GL } from "./types";

const { inferBasicDef, tagStructName, inferSize, inferStructNameOrBasicDef } = GL.Uniform.Defs;

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
                    console.log("struct", name);
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
                                console.log(
                                    "inferArrayDef",
                                    { type: uniformType, size: arrayQuantifiers },
                                    arrayQuantifiers
                                );
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
                                            size: arrayQuantifiers,
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

/* export async function extractShaderUniforms(source: string) {

    
    await ParserModule.Parser.init();
    const parser = new Parser();
    const Lang = await ParserModule.Language.load('tree-sitter-glsl.wasm');
    parser.setLanguage(Lang);

    const structs: Record<string, Struct> = {};
    const structTypes: Record<string, string> = {};
    const uniforms: Record<string, Uniform> = {};
    const uniformTypes: Record<string, { value: string }> = {};

    function structTypeIsComplete(identifier: string) {
        return structTypes?.[identifier]?.endsWith('};\n') ?? false;
    }

    try {
        const tree = parser.parse(source);

        if (tree === null) {
            return "";
        }

        const stack: ParserModule.Node[] = [tree.rootNode];

        while (stack.length > 0) {
            const node = stack.pop();
            match(node)
                .with({ type: 'declaration', children: [{ type: 'uniform' }, ...P.array({ text: P.string })] }, (input) => {
                    const identifierType = input.children[2].type;
                    const qualifier = input.children[1].text;
                    if (identifierType === 'array_declarator') {
                        const identifier = input?.children[2]?.children[0]?.text;
                        const quantifier = Number(input?.children[2]?.children[2]?.text);
                        const value = defaultValue[qualifier] || structs[qualifier];
                        if (identifier) {
                            uniforms[identifier] = {
                                value: Array(quantifier).fill(value)
                            }
                            const type = primitives[qualifier] || qualifier;
                            uniformTypes[identifier] = { value: `[${Array(quantifier).fill(type).join(', ')}]` };
                        }
                    } else {
                        const identifier = input?.children[2]?.text;
                        if (identifier) {
                            const value = defaultValue[qualifier] || structs[qualifier];
                            uniforms[identifier] = {
                                value
                            }
                            uniformTypes[identifier] = { value: primitives[qualifier] || qualifier };
                        }
                    }
                })
                .with({ type: 'struct_specifier' }, () => {
                    const identifier = node?.children[1]?.text;
                    if (typeof identifier === 'undefined') {
                        return;
                    }
                    structs[identifier] = {} as Struct;
                    if (!structTypeIsComplete(identifier)) {
                        structTypes[identifier] = `{\n`;
                    }
                    for (const child of node?.children[2]?.children ?? []) {
                        if (child?.type === 'field_declaration') {
                            if (child?.children[1]?.childCount) {
                                let quantifier: number = 1;
                                for (const subChild of child?.children[1]?.children ?? []) {
                                    if (subChild?.type === 'array_declarator') {
                                        quantifier = Number(subChild?.children[2]?.text);
                                        break;
                                    }
                                }
                                const qualifier = child?.children[0]?.text;
                                const nestedIdentifier = child?.children[2]?.text;
                                if (typeof qualifier === 'undefined' || typeof nestedIdentifier === 'undefined') {
                                    return;
                                }
                                const value = defaultValue[qualifier] || structs[qualifier];
                                structs[identifier][nestedIdentifier] = Array(quantifier).fill(value);
                                if (!structTypeIsComplete(identifier)) {
                                    const type = primitives[qualifier] || qualifier;
                                    structTypes[identifier] += `${nestedIdentifier}: [${Array(quantifier).fill(type).join(', ')}]\n`;
                                }
                            } else {
                                const qualifier = child?.children[0]?.text;
                                const nestedIdentifier = child?.children[1]?.text;
                                if (typeof qualifier === 'undefined' || typeof nestedIdentifier === 'undefined') {
                                    return;
                                }
                                const value = defaultValue[qualifier] || structs[qualifier];
                                structs[identifier][nestedIdentifier] = value;
                                if (!structTypeIsComplete(identifier)) {
                                    structTypes[identifier] += `${nestedIdentifier}: ${primitives[qualifier] || qualifier}\n`;
                                }
                            }
                        }
                    }
                    if (!structTypeIsComplete(identifier)) {
                        structTypes[identifier] += "}\n";
                    }
                })
                .otherwise(() => {
                });

            if (node?.children?.length) {
                // Push children in reverse order so they're popped in original order
                for (let i = node.children.length - 1; i >= 0; i--) {
                    const child = node.children[i];
                    if (child) {
                        stack.push(child);
                    }
                }
            }
        }

        const structTypesString = Object.entries(structTypes).map(([key, value]) => `export interface ${key} ${value}\n`).join('\n');
        const uniformTypesString = `export interface Uniforms ${JSON.stringify(uniformTypes, null, 4)}`;

        const uniformsString = `export const defaultUniforms: Uniforms = ${JSON.stringify(uniforms, null, 4)};`;

        let output = `${structTypesString}${uniformTypesString}\n${uniformsString}`.replaceAll('"', '');

        return output;
    } catch (err: any) {
        return "";
    }
};

*/
