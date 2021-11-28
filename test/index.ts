import test from "ava"
import * as dt from "../src/index"

/** Utility for asserting inferred type correctness. */
type Assert<A extends B, B> = {}

test("null", t => {
	const d = dt.null_
	t.is(d.is(null), true)
	t.is(d.is(undefined), false)
	t.is(dt.nullDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "null")
	type a1 = Assert<typeof d.value, null>
	t.is(dt.formatError(d.validate(undefined)!), "undefined is not null")
})

test("undefined", t => {
	const d = dt.undefined_
	t.is(d.is(undefined), true)
	t.is(d.is(null), false)
	t.is(dt.undefinedDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "undefined")
	type a1 = Assert<typeof d.value, undefined>
	t.is(dt.formatError(d.validate(null)!), "null is not undefined")
})

test("string", t => {
	const d = dt.string
	t.is(d.is("asf"), true)
	t.is(d.is(12), false)
	t.is(dt.stringDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "string")
	type a1 = Assert<typeof d.value, string>
	t.is(dt.formatError(d.validate(12)!), "12 is not a string")
})

test("number", t => {
	const d = dt.number
	t.is(d.is(12), true)
	t.is(d.is("asdf"), false)
	t.is(dt.numberDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "number")
	type a1 = Assert<typeof d.value, number>
	t.is(dt.formatError(d.validate("hello")!), '"hello" is not a number')
})

test("boolean", t => {
	const d = dt.boolean
	t.is(d.is(true), true)
	t.is(d.is(false), true)
	t.is(d.is(undefined), false)
	t.is(dt.booleanDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "boolean")
	type a1 = Assert<typeof d.value, boolean>
	t.is(dt.formatError(d.validate(12)!), "12 is not a boolean")
})

test("literal string", t => {
	const d = dt.literal("hello")
	t.is(d.is("hello"), true)
	t.is(d.is("world"), false)
	t.is(dt.literalDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), `"hello"`)
	type a1 = Assert<typeof d.value, "hello">
	t.is(dt.formatError(d.validate("world")!), '"world" is not "hello"')
})

test("literal number", t => {
	const d = dt.literal(12)
	t.is(d.is(12), true)
	t.is(d.is(13), false)
	t.is(dt.literalDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "12")
	type a1 = Assert<typeof d.value, 12>
	t.is(dt.formatError(d.validate(9)!), "9 is not 12")
})

test("literal boolean", t => {
	const d = dt.literal(true)
	t.is(d.is(true), true)
	t.is(d.is(false), false)
	t.is(dt.literalDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "true")
	type a1 = Assert<typeof d.value, true>
	t.is(dt.formatError(d.validate(9)!), "9 is not true")
})

test("array", t => {
	const d = dt.array(dt.number)
	t.is(d.is([1, 2, 3]), true)
	t.is(d.is([]), true)
	t.is(d.is([1, 2, "12"]), false)
	t.is(dt.arrayDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "Array<number>")
	type a1 = Assert<typeof d.value, Array<number>>
	t.is(dt.formatError(d.validate(9)!), "9 is not an array")
	t.is(dt.formatError(d.validate(["x"])!), `[0]: "x" is not a number`)
})

test("tuple", t => {
	const d = dt.tuple(dt.number, dt.string)
	t.is(d.is([1, "yes"]), true)
	t.is(d.is([1, "yes", "ignore"]), true)
	t.is(d.is([1]), false)
	t.is(d.is(["hello"]), false)
	t.is(dt.tupleDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "[number, string]")
	type a1 = Assert<typeof d.value, [number, string]>
	t.is(dt.formatError(d.validate(9)!), "9 is not an array")
	t.is(dt.formatError(d.validate([1, 2])!), `[1]: 2 is not a string`)
})

test("map", t => {
	const d = dt.map(dt.number)
	t.is(d.is({ a: 1, b: 2 }), true)
	t.is(d.is({}), true)
	t.is(d.is({ a: 1, b: "hello" }), false)
	t.is(dt.mapDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "{ [key: string]: number }")
	type a1 = Assert<typeof d.value, { [key: string]: number }>
	t.is(dt.formatError(d.validate(9)!), "9 is not a map")
	t.is(dt.formatError(d.validate({ a: "b", b: 1 })!), `.a: "b" is not a number`)
})

test("object", t => {
	const d = dt.object({
		required: {
			a: dt.number,
		},
		optional: {
			b: dt.string,
		},
	})
	t.is(d.is({ a: 1 }), true)
	t.is(d.is({ a: 1, b: "hello" }), true)
	t.is(d.is({ a: 1, b: "hello", c: "ignore" }), true)
	t.is(d.is({}), false)
	t.is(d.is({ a: 1, b: 2 }), false)
	t.is(dt.objectDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "{ a: number; b?: string }")
	type a1 = Assert<typeof d.value, { a: number; b?: string }>
	t.is(dt.formatError(d.validate(9)!), "9 is not an object")
	t.is(dt.formatError(d.validate({})!), ".a: undefined is not a number")
	t.is(
		dt.formatError(d.validate({ a: 1, b: 2 })!),
		[
			".b: 2 must satisfy one of:",
			"  2 is not a string",
			"  2 is not undefined",
		].join("\n")
	)
})

test("obj", t => {
	const a = dt.object({
		required: {
			a: dt.number,
		},
		optional: {},
	})

	const b = dt.obj({
		a: dt.number,
	})
	t.deepEqual(a.dataType, b.dataType)
})

test("any", t => {
	const d = dt.any
	t.is(d.is(null), true)
	t.is(d.is(undefined), true)
	t.is(d.is(1), true)
	t.is(d.is("hello"), true)
	t.is(d.is({}), true)
	t.is(d.is([]), true)
	t.is(dt.anyDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "any")
	type a1 = Assert<typeof d.value, any>
})

test("or simple", t => {
	const d = dt.or(dt.number, dt.string)
	t.is(d.is(1), true)
	t.is(d.is("hello"), true)
	t.is(d.is({}), false)
	t.is(dt.orDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), "number | string")
	type a1 = Assert<typeof d.value, number | string>
	t.is(
		dt.formatError(d.validate({})!),
		[
			"{} must satisfy one of:",
			"  {} is not a number",
			"  {} is not a string",
		].join("\n")
	)
})

test("or object", t => {
	const d = dt.or(
		dt.object({
			required: {
				type: dt.literal("loading"),
			},
			optional: {},
		}),
		dt.object({
			required: {
				type: dt.literal("ready"),
				result: dt.number,
			},
			optional: {},
		})
	)

	t.is(d.is({ type: "loading" }), true)
	t.is(d.is({ type: "ready", result: 12 }), true)
	t.is(d.is({ type: "ready" }), false)
	t.is(d.is({}), false)
	t.is(dt.orDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
	t.is(d.toString(), `{ type: "loading" } | { type: "ready"; result: number }`)
	type a1 = Assert<
		typeof d.value,
		{ type: "loading" } | { type: "ready"; result: number }
	>
	t.is(
		dt.formatError(d.validate({ type: "ready" })!),
		[
			`{"type":"ready"} must satisfy one of:`,
			`  .type: "ready" is not "loading"`,
			"  .result: undefined is not a number",
		].join("\n")
	)
})
