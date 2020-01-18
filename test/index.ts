import test from "ava"
import * as dt from "../src/index"

test("null", t => {
	const d = dt.null_
	t.is(d.is(null), true)
	t.is(d.is(undefined), false)
})

test("undefined", t => {
	const d = dt.undefined_
	t.is(d.is(undefined), true)
	t.is(d.is(null), false)
})

test("string", t => {
	const d = dt.string
	t.is(d.is("asf"), true)
	t.is(d.is(12), false)
})

test("number", t => {
	const d = dt.number
	t.is(d.is(12), true)
	t.is(d.is("asdf"), false)
})

test("boolean", t => {
	const d = dt.boolean
	t.is(d.is(true), true)
	t.is(d.is(false), true)
	t.is(d.is(undefined), false)
})

test("literal string", t => {
	const d = dt.literal("hello")
	t.is(d.is("hello"), true)
	t.is(d.is("world"), false)
})

test("literal number", t => {
	const d = dt.literal(12)
	t.is(d.is(12), true)
	t.is(d.is(13), false)
})

test("literal boolean", t => {
	const d = dt.literal(true)
	t.is(d.is(true), true)
	t.is(d.is(false), false)
})

test("array", t => {
	const d = dt.array(dt.number)
	t.is(d.is([1, 2, 3]), true)
	t.is(d.is([]), true)
	t.is(d.is([1, 2, "12"]), false)
})

test("tuple", t => {
	const d = dt.tuple(dt.number, dt.string)
	t.is(d.is([1, "yes"]), true)
	t.is(d.is([1, "yes", "ignore"]), true)
	t.is(d.is([1]), false)
	t.is(d.is(["hello"]), false)
})

test("map", t => {
	const d = dt.map(dt.number)
	t.is(d.is({ a: 1, b: 2 }), true)
	t.is(d.is({}), true)
	t.is(d.is({ a: 1, b: "hello" }), false)
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
})

test("any", t => {
	const d = dt.any
	t.is(d.is(null), true)
	t.is(d.is(undefined), true)
	t.is(d.is(1), true)
	t.is(d.is("hello"), true)
	t.is(d.is({}), true)
	t.is(d.is([]), true)
})

test("or simple", t => {
	const d = dt.or(dt.number, dt.string)
	t.is(d.is(1), true)
	t.is(d.is("hello"), true)
	t.is(d.is({}), false)
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
})
