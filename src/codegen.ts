/*

./node_modules/.bin/tsx src/tools/buildSchema.ts

*/

import * as fs from "fs-extra"
import { isPlainObject } from "lodash"
import * as prettier from "prettier"
import * as ts from "typescript"

// Helper function to convert a TypeScript type node to the desired schema
// Convert TypeScript TypeNode to the DataType representation
function convertType(typeNode: ts.TypeNode): DataType {
	switch (typeNode.kind) {
		case ts.SyntaxKind.NumberKeyword:
			return { type: "number" }
		case ts.SyntaxKind.StringKeyword:
			return { type: "string" }
		case ts.SyntaxKind.BooleanKeyword:
			return { type: "boolean" }
		case ts.SyntaxKind.NullKeyword:
			return { type: "null" }
		case ts.SyntaxKind.UndefinedKeyword:
			return { type: "undefined" }
		case ts.SyntaxKind.LiteralType:
			const literal = (typeNode as ts.LiteralTypeNode).literal
			switch (literal.kind) {
				case ts.SyntaxKind.StringLiteral:
					return { type: "literal", value: literal.text }
				case ts.SyntaxKind.NumericLiteral:
					return { type: "literal", value: parseFloat(literal.text) }
				case ts.SyntaxKind.TrueKeyword:
					return { type: "literal", value: true }
				case ts.SyntaxKind.FalseKeyword:
					return { type: "literal", value: false }
				case ts.SyntaxKind.NullKeyword:
					return { type: "null" }
				case ts.SyntaxKind.UndefinedKeyword:
					return { type: "undefined" }
				default:
					throw new Error(
						`Unsupported literal kind: ${ts.SyntaxKind[literal.kind]}`
					)
			}
		case ts.SyntaxKind.UnionType:
			const unionType = typeNode as ts.UnionTypeNode
			return {
				type: "or",
				values: unionType.types.map(innerTypeNode =>
					convertType(innerTypeNode)
				),
			}
		case ts.SyntaxKind.TypeLiteral:
			const typeLiteralNode = typeNode as ts.TypeLiteralNode
			const objectDataType: ObjectDataType = {
				type: "object",
				required: {},
				optional: {},
			}
			typeLiteralNode.members.forEach(member => {
				if (ts.isPropertySignature(member)) {
					const key = (member.name as ts.Identifier).escapedText.toString()
					const isOptional = !!member.questionToken
					const type = convertType(member.type!)
					if (isOptional) {
						objectDataType.optional[key] = type
					} else {
						objectDataType.required[key] = type
					}
				}
			})
			return objectDataType
		case ts.SyntaxKind.TypeReference:
			const typeRefNode = typeNode as ts.TypeReferenceNode
			let typeName: string
			if (ts.isIdentifier(typeRefNode.typeName)) {
				typeName = typeRefNode.typeName.text // Directly use 'text' property
			} else {
				throw new Error("Nope")
				// For qualified names like 'a.b', this would need additional handling
				// typeName = typeRefNode.typeName.getText() // This should be a fallback only
			}

			return { type: "reference", name: typeName }
		default:
			return { type: "any" } // Fallback for unhandled cases
	}
}

type NullDataType = { type: "null" }
type UndefinedDataType = { type: "undefined" }
type StringDataType = { type: "string" }
type NumberDataType = { type: "number" }
type BooleanDataType = { type: "boolean" }
type LiteralDataType = {
	type: "literal"
	value: string | number | boolean
}
type ArrayDataType = { type: "array"; inner: DataType }
type TupleDataType = { type: "tuple"; values: Array<DataType> }
type ObjectDataType = {
	type: "object"
	required: { [key: string]: DataType }
	optional: { [key: string]: DataType }
}
type OrDataType = { type: "or"; values: Array<DataType> }
type AnyDataType = { type: "any" }

type MapDataType = { type: "map"; inner: DataType }
type ReferenceType = { type: "reference"; name: string }

// Need to add a reference DataType.
type DataType =
	| NullDataType
	| UndefinedDataType
	| StringDataType
	| NumberDataType
	| BooleanDataType
	| LiteralDataType
	| ArrayDataType
	| TupleDataType
	| MapDataType
	| ObjectDataType
	| AnyDataType
	| OrDataType
	| ReferenceType

type TypeCache = {
	[key: string]: DataType
}

const BAKED_IN = true

export async function codegen(args: {
	sourcePath: string
	outputPath: string
}) {
	// Read the file and create a SourceFile object
	const program = ts.createProgram([args.sourcePath], {})
	const sourceFile = program.getSourceFile(args.outputPath)
	if (!sourceFile) throw new Error(`File ${args.sourcePath} not found`)

	// Generate schema types content
	const processedTypes: TypeCache = {}
	ts.forEachChild(sourceFile, node => {
		if (ts.isTypeAliasDeclaration(node)) {
			const dataType = convertType(node.type)
			const typeName = node.name.text
			processedTypes[typeName] = dataType
		}
	})

	const output = Object.entries(processedTypes)
		.map(([typeName, dataType]) => {
			const str = JSON.stringify(dataType, (key, value) => {
				if (!isPlainObject(value)) return value
				if (value.type !== "reference") return value
				if (BAKED_IN) return processedTypes[value.name]
				return `REF$${value.name}`
			})
			return `export const ${typeName} = ${str};\n`
		})
		.join("\n\n")
		.replace(/"REF\$([^"]+)"/g, "$1")

	const options = await prettier.resolveConfig(args.sourcePath)
	const prettyOutput = await prettier.format(output, {
		...options,
		parser: "typescript",
	})

	// Write to the output file
	await fs.writeFile(args.outputPath, prettyOutput)
}
