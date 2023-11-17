import { strict as assert } from "assert"
import { describe, it } from "mocha"
import * as dt from "."

/** Utility for asserting inferred type correctness. */
type Assert<A extends B, B> = {}

describe("data-type-ts", () => {
	it("null", () => {
		const d = dt.null_
		assert.equal(d.is(null), true)
		assert.equal(d.is(undefined), false)
		assert.equal(d.toString(), "null")
		type a1 = Assert<typeof d.value, null>
		assert.equal(
			dt.formatError(d.validate(undefined)!),
			"undefined is not null"
		)
	})

	it("undefined", () => {
		const d = dt.undefined_
		assert.equal(d.is(undefined), true)
		assert.equal(d.is(null), false)
		assert.equal(d.toString(), "undefined")
		type a1 = Assert<typeof d.value, undefined>
		assert.equal(dt.formatError(d.validate(null)!), "null is not undefined")
	})

	it("string", () => {
		const d = dt.string
		assert.equal(d.is("asf"), true)
		assert.equal(d.is(12), false)
		assert.equal(d.toString(), "string")
		type a1 = Assert<typeof d.value, string>
		assert.equal(dt.formatError(d.validate(12)!), "12 is not a string")
	})

	it("number", () => {
		const d = dt.number
		assert.equal(d.is(12), true)
		assert.equal(d.is("asdf"), false)
		assert.equal(d.toString(), "number")
		type a1 = Assert<typeof d.value, number>
		assert.equal(
			dt.formatError(d.validate("hello")!),
			'"hello" is not a number'
		)
	})

	it("boolean", () => {
		const d = dt.boolean
		assert.equal(d.is(true), true)
		assert.equal(d.is(false), true)
		assert.equal(d.is(undefined), false)
		assert.equal(d.toString(), "boolean")
		type a1 = Assert<typeof d.value, boolean>
		assert.equal(dt.formatError(d.validate(12)!), "12 is not a boolean")
	})

	it("literal string", () => {
		const d = dt.literal("hello")
		assert.equal(d.is("hello"), true)
		assert.equal(d.is("world"), false)
		assert.equal(d.toString(), `"hello"`)
		type a1 = Assert<typeof d.value, "hello">
		assert.equal(dt.formatError(d.validate("world")!), '"world" is not "hello"')
	})

	it("literal number", () => {
		const d = dt.literal(12)
		assert.equal(d.is(12), true)
		assert.equal(d.is(13), false)
		assert.equal(d.toString(), "12")
		type a1 = Assert<typeof d.value, 12>
		assert.equal(dt.formatError(d.validate(9)!), "9 is not 12")
	})

	it("literal boolean", () => {
		const d = dt.literal(true)
		assert.equal(d.is(true), true)
		assert.equal(d.is(false), false)
		assert.equal(d.toString(), "true")
		type a1 = Assert<typeof d.value, true>
		assert.equal(dt.formatError(d.validate(9)!), "9 is not true")
	})

	it("array", () => {
		const d = dt.array(dt.number)
		assert.equal(d.is([1, 2, 3]), true)
		assert.equal(d.is([]), true)
		assert.equal(d.is([1, 2, "12"]), false)
		assert.equal(d.toString(), "Array<number>")
		type a1 = Assert<typeof d.value, Array<number>>
		assert.equal(dt.formatError(d.validate(9)!), "9 is not an array")
		assert.equal(dt.formatError(d.validate(["x"])!), `[0]: "x" is not a number`)
	})

	it("tuple", () => {
		const d = dt.tuple(dt.number, dt.string)
		assert.equal(d.is([1, "yes"]), true)
		assert.equal(d.is([1, "yes", "ignore"]), true)
		assert.equal(d.is([1]), false)
		assert.equal(d.is(["hello"]), false)
		assert.equal(d.toString(), "[number, string]")
		type a1 = Assert<typeof d.value, [number, string]>
		assert.equal(dt.formatError(d.validate(9)!), "9 is not an array")
		assert.equal(dt.formatError(d.validate([1, 2])!), `[1]: 2 is not a string`)
	})

	it("map", () => {
		const d = dt.map(dt.number)
		assert.equal(d.is({ a: 1, b: 2 }), true)
		assert.equal(d.is({}), true)
		assert.equal(d.is({ a: 1, b: "hello" }), false)
		assert.equal(d.toString(), "{ [key: string]: number }")
		type a1 = Assert<typeof d.value, { [key: string]: number }>
		assert.equal(dt.formatError(d.validate(9)!), "9 is not a map")
		assert.equal(
			dt.formatError(d.validate({ a: "b", b: 1 })!),
			`.a: "b" is not a number`
		)
	})

	it("object", () => {
		const d = dt.object({
			a: dt.number,
			b: dt.optional(dt.string),
		})
		assert.equal(d.is({ a: 1 }), true)
		assert.equal(d.is({ a: 1, b: "hello" }), true)
		assert.equal(d.is({ a: 1, b: "hello", c: "ignore" }), true)
		assert.equal(d.is({}), false)
		assert.equal(d.is({ a: 1, b: 2 }), false)
		// assert.equal(d.toString(), "{ a: number; b?: string }")
		assert.equal(d.toString(), "{ a: number; b: string | undefined }")
		type a1 = Assert<typeof d.value, { a: number; b?: string }>
		assert.equal(dt.formatError(d.validate(9)!), "9 is not an object")
		assert.equal(
			dt.formatError(d.validate({})!),
			".a: undefined is not a number"
		)
		assert.equal(
			dt.formatError(d.validate({ a: 1, b: 2 })!),
			[
				".b: 2 must satisfy one of:",
				"  2 is not a string",
				"  2 is not undefined",
			].join("\n")
		)
	})

	it("object strict", () => {
		const d = dt.object(
			{
				a: dt.number,
				b: dt.optional(dt.string),
			},
			true
		)
		assert.equal(d.is({ a: 1 }), true)
		assert.equal(d.is({ a: 1, b: "hello" }), true)
		assert.equal(d.is({ a: 1, b: "hello", c: "ignore" }), false)
		assert.equal(
			dt.formatError(d.validate({ a: 1, b: "hello", c: "ignore" })!),
			`{"a":1,"b":"hello","c":"ignore"} contains extra keys: "c"`
		)
	})

	it("any", () => {
		const d = dt.any
		assert.equal(d.is(null), true)
		assert.equal(d.is(undefined), true)
		assert.equal(d.is(1), true)
		assert.equal(d.is("hello"), true)
		assert.equal(d.is({}), true)
		assert.equal(d.is([]), true)
		assert.equal(d.toString(), "any")
		type a1 = Assert<typeof d.value, any>
	})

	it("union simple", () => {
		const d = dt.union(dt.number, dt.string)
		assert.equal(d.is(1), true)
		assert.equal(d.is("hello"), true)
		assert.equal(d.is({}), false)
		assert.equal(d.toString(), "number | string")
		type a1 = Assert<typeof d.value, number | string>
		assert.equal(
			dt.formatError(d.validate({})!),
			[
				"{} must satisfy one of:",
				"  {} is not a number",
				"  {} is not a string",
			].join("\n")
		)
	})

	it("union object", () => {
		const d = dt.union(
			dt.object({
				type: dt.literal("loading"),
			}),
			dt.object({
				type: dt.literal("ready"),
				result: dt.number,
			})
		)

		assert.equal(d.is({ type: "loading" }), true)
		assert.equal(d.is({ type: "ready", result: 12 }), true)
		assert.equal(d.is({ type: "ready" }), false)
		assert.equal(d.is({}), false)
		assert.equal(
			d.toString(),
			`{ type: "loading" } | { type: "ready"; result: number }`
		)
		type a1 = Assert<
			typeof d.value,
			{ type: "loading" } | { type: "ready"; result: number }
		>
		assert.equal(
			dt.formatError(d.validate({ type: "ready" })!),
			[
				`{"type":"ready"} must satisfy one of:`,
				`  .type: "ready" is not "loading"`,
				"  .result: undefined is not a number",
			].join("\n")
		)
	})

	it("conforms", () => {
		type User = {
			id: string
			name: string
			age?: number[]
		}

		const userType = dt.object<User>({
			id: dt.string,
			name: dt.string,
			age: dt.array(dt.number),
			// age: dt.optional(dt.array(dt.number)),
		})
	})
})
