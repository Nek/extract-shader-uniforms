import { parser, generate } from "@shaderfrog/glsl-parser";
import { visit, type NodeVisitors } from "@shaderfrog/glsl-parser/ast";
import { GL, Size } from "./types";

const { tagStructName, inferSize, inferStructNameOrBasicDef } = GL.Uniform.Defs;

export function extractRelevantData(source: string) {
    let ast = parser.parse(source);
    const { bindings, types } = ast.scopes[0];
    const globalVars = Object.keys(bindings);
    const structNames = Object.keys(types);

    function getDataForTypeDef(typeSpec) {
        //TODO: implement arrays
        const [typeName, ...size] = typeSpec;
        if (structNames.includes(typeName)) {
            return structsData[typeName];
        } else {
            return typeSpec;
        }
    }

    // console.log(topLevelDefs, structs);
    // console.log(bindings, types)
    // const newSource = generate(ast);
    // ast = parser.parse(newSource);

    const uniformDefs: Record<string, any> = {};
    const uniformsData: Record<string, any> = {};
    const structDefs: Record<string, any> = {};
    const structsData: Record<string, a> = {};

    // const uniformDefs: GL.Uniform.Defs.Struct = {};
    // const uniformsData: GL.Uniform.Data.Scope = {};
    // const structsData: Record<string, GL.Uniform.Data.Scope> = {};
    // const structDefs: Record<string, GL.Uniform.Defs.Struct> = {};

    const structDefVisitors: NodeVisitors = {
        type_name: {
            enter(p) {
                const id = p.node.identifier;
                if (!structNames.includes(id)) {
                    p.skip();
                    return;
                }
                if (structDefs[id]) {
                    p.skip();
                    return;
                }
                if (p.parent?.type !== "struct") {
                    p.skip();
                    return;
                }
                let membersDefs: Record<string, any> = {};
                let membersData: Record<string, any> = {};
                for (const member of p.parent.declarations) {
                    let memberTypeName;
                    const typeSpec = member.declaration.specified_type.specifier.specifier;
                    if (typeSpec.type === "keyword") {
                        memberTypeName = typeSpec.token;
                    }
                    if (typeSpec.type === "type_name") {
                        memberTypeName = typeSpec.identifier;
                    }
                    if (!memberTypeName) {
                        break;
                    }
                    let memberId;
                    const memberSize = [];
                    for (const innerD of member.declaration.declarations) {
                        memberId = innerD.identifier.identifier;
                        if (innerD.quantifier) {
                            for (const q of innerD.quantifier) {
                                if (q.type === "array_specifier" && q.expression.type === "int_constant") {
                                    memberSize.push(parseInt(q.expression.token, 10));
                                }
                                if (memberSize.length === 2) {
                                    break;
                                }
                            }
                            if (memberSize[1] < 2) {
                                memberSize.pop();
                            }
                            if (memberSize[0] < 2) {
                                memberSize.pop();
                            }
                        }
                    }
                    const typeDef = (function (s) {
                        switch (s.length) {
                            case 1:
                                return [memberTypeName, s[0]] as [string, number];
                            case 2:
                                return [memberTypeName, s[0], s[1]] as [string, number, number];
                            default:
                                return [memberTypeName] as [string];
                        }
                    })(memberSize);
                    if (memberId) {
                        membersDefs[memberId] = typeDef;
                        membersData[memberId] = getDataForTypeDef(typeDef);
                    }
                }
                structsData[id] = membersData
                structDefs[id] = membersDefs;
            },
        },
    };

    const uniformDefVisitors: NodeVisitors = {
        identifier: {
            enter(p) {
                const id = p.node.identifier;
                if (!globalVars.includes(id)) {
                    p.skip();
                    return;
                }
                const declarator = p.parentPath?.parent;
                if (declarator?.type !== "declarator_list") {
                    p.skip();
                    return;
                }
                const keywordNode2 = declarator.specified_type.qualifiers?.[0];
                if (keywordNode2?.type !== "keyword" || keywordNode2?.token !== "uniform") {
                    p.skip();
                    return;
                }

                const typeNode = declarator.specified_type.specifier.specifier;

                const typeName = (() => {
                    if (typeNode.type === "keyword") {
                        return typeNode.token;
                    }
                    if (typeNode.type === "type_name") {
                        return typeNode.identifier;
                    }
                    return;
                })();

                if (!typeName) {
                    p.skip();
                    return;
                }

                const size = [];
                if (p.parent?.type === "declaration") {
                    const quantifier = p.parent?.quantifier;
                    if (quantifier) {
                        for (const q of quantifier) {
                            if (q.type === "array_specifier" && q.expression.type === "int_constant") {
                                size.push(parseInt(q.expression.token, 10));
                            }
                            if (size.length === 2) {
                                break;
                            }
                        }
                        if (size[1] < 2) {
                            size.pop();
                        }
                        if (size[0] < 2) {
                            size.pop();
                        }
                    }
                }
                const typeDef = (function (s) {
                    switch (s.length) {
                        case 1:
                            return [typeName, s[0]] as [string, number];
                        case 2:
                            return [typeName, s[0], s[1]] as [string, number, number];
                        default:
                            return [typeName] as [string];
                    }
                })(size);
                uniformDefs[id] = typeDef;
                uniformsData[id] = getDataForTypeDef(typeDef);
            },
        },
    };

    visit(ast, structDefVisitors);
    visit(ast, uniformDefVisitors);

    console.log(structDefs, uniformDefs);
    console.log(structsData, uniformsData);

    return {
        structDefs,
        structsData,
        uniformDefs,
        uniformsData,
    };
}
