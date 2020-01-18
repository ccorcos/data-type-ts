import test from "ava"
import * as dt from "../src/index"

test("null", t => {
	const d = dt.null_
	t.is(d.is(null), true)
	t.is(d.is(undefined), false)
	t.is(dt.nullDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
})

test("undefined", t => {
	const d = dt.undefined_
	t.is(d.is(undefined), true)
	t.is(d.is(null), false)
	t.is(dt.undefinedDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
})

test("string", t => {
	const d = dt.string
	t.is(d.is("asf"), true)
	t.is(d.is(12), false)
	t.is(dt.stringDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
})

test("number", t => {
	const d = dt.number
	t.is(d.is(12), true)
	t.is(d.is("asdf"), false)
	t.is(dt.numberDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
})

test("boolean", t => {
	const d = dt.boolean
	t.is(d.is(true), true)
	t.is(d.is(false), true)
	t.is(d.is(undefined), false)
	t.is(dt.booleanDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
})

test("literal string", t => {
	const d = dt.literal("hello")
	t.is(d.is("hello"), true)
	t.is(d.is("world"), false)
	t.is(dt.literalDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
})

test("literal number", t => {
	const d = dt.literal(12)
	t.is(d.is(12), true)
	t.is(d.is(13), false)
	t.is(dt.literalDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
})

test("literal boolean", t => {
	const d = dt.literal(true)
	t.is(d.is(true), true)
	t.is(d.is(false), false)
	t.is(dt.literalDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
})

test("array", t => {
	const d = dt.array(dt.number)
	t.is(d.is([1, 2, 3]), true)
	t.is(d.is([]), true)
	t.is(d.is([1, 2, "12"]), false)
	t.is(dt.arrayDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
})

test("tuple", t => {
	const d = dt.tuple(dt.number, dt.string)
	t.is(d.is([1, "yes"]), true)
	t.is(d.is([1, "yes", "ignore"]), true)
	t.is(d.is([1]), false)
	t.is(d.is(["hello"]), false)
	t.is(dt.tupleDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
})

test("map", t => {
	const d = dt.map(dt.number)
	t.is(d.is({ a: 1, b: 2 }), true)
	t.is(d.is({}), true)
	t.is(d.is({ a: 1, b: "hello" }), false)
	t.is(dt.mapDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
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
})

test("or simple", t => {
	const d = dt.or(dt.number, dt.string)
	t.is(d.is(1), true)
	t.is(d.is("hello"), true)
	t.is(d.is({}), false)
	t.is(dt.orDataType.is(d.dataType), true)
	t.is(dt.dataTypeDataType.is(d.dataType), true)
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
})
