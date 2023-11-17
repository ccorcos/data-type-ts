import { strict as assert } from "assert"
import { describe, it } from "mocha"
import * as t from "."

/** Utility for asserting inferred type correctness. */
type Assert<A extends B, B> = {}

describe("data-type-ts", () => {
	it("null", () => {
		const d = t.null_
		assert.equal(d.is(null), true)
		assert.equal(d.is(undefined), false)
		assert.equal(d.toString(), "null")
		type a1 = Assert<t.Infer<typeof d>, null>
		assert.equal(t.formatError(d.validate(undefined)!), "undefined is not null")
	})

	it("undefined", () => {
		const d = t.undefined_
		assert.equal(d.is(undefined), true)
		assert.equal(d.is(null), false)
		assert.equal(d.toString(), "undefined")
		type a1 = Assert<t.Infer<typeof d>, undefined>
		assert.equal(t.formatError(d.validate(null)!), "null is not undefined")
	})

	it("string", () => {
		const d = t.string
		assert.equal(d.is("asf"), true)
		assert.equal(d.is(12), false)
		assert.equal(d.toString(), "string")
		type a1 = Assert<t.Infer<typeof d>, string>
		assert.equal(t.formatError(d.validate(12)!), "12 is not a string")
	})

	it("number", () => {
		const d = t.number
		assert.equal(d.is(12), true)
		assert.equal(d.is("asdf"), false)
		assert.equal(d.toString(), "number")
		type a1 = Assert<t.Infer<typeof d>, number>
		assert.equal(t.formatError(d.validate("hello")!), '"hello" is not a number')
	})

	it("boolean", () => {
		const d = t.boolean
		assert.equal(d.is(true), true)
		assert.equal(d.is(false), true)
		assert.equal(d.is(undefined), false)
		assert.equal(d.toString(), "boolean")
		type a1 = Assert<t.Infer<typeof d>, boolean>
		assert.equal(t.formatError(d.validate(12)!), "12 is not a boolean")
	})

	it("literal string", () => {
		const d = t.literal("hello")
		assert.equal(d.is("hello"), true)
		assert.equal(d.is("world"), false)
		assert.equal(d.toString(), `"hello"`)

		type a1 = Assert<t.Infer<typeof d>, "hello"> // Infers
		// @ts-expect-error
		t.literal<"hello">("world") // Conforms

		assert.equal(t.formatError(d.validate("world")!), '"world" is not "hello"')
	})

	it("literal number", () => {
		const d = t.literal(12)
		assert.equal(d.is(12), true)
		assert.equal(d.is(13), false)
		assert.equal(d.toString(), "12")
		type a1 = Assert<t.Infer<typeof d>, 12> // Infers
		// @ts-expect-error
		t.literal<12>(13) // Conforms
		assert.equal(t.formatError(d.validate(9)!), "9 is not 12")
	})

	it("literal boolean", () => {
		const d = t.literal(true)
		assert.equal(d.is(true), true)
		assert.equal(d.is(false), false)
		assert.equal(d.toString(), "true")
		type a1 = Assert<t.Infer<typeof d>, true> // Infers
		// @ts-expect-error
		t.literal<true>(false) // Conforms
		assert.equal(t.formatError(d.validate(9)!), "9 is not true")
	})

	it("array", () => {
		const d = t.array(t.number)
		assert.equal(d.is([1, 2, 3]), true)
		assert.equal(d.is([]), true)
		assert.equal(d.is([1, 2, "12"]), false)
		assert.equal(d.toString(), "Array<number>")

		type a1 = Assert<t.Infer<typeof d>, Array<number>> // Infers
		// Conforms
		// @ts-expect-error
		const v1: t.Validator<number[]> = t.array(t.string)
		// @ts-expect-error
		const v2: t.Validator<(string | number)[]> = t.array(t.string)
		const v3: t.Validator<(string | number)[]> = t.array(
			t.union(t.string, t.number)
		)

		assert.equal(t.formatError(d.validate(9)!), "9 is not an array")
		assert.equal(t.formatError(d.validate(["x"])!), `[0]: "x" is not a number`)
	})

	it("tuple", () => {
		const d = t.tuple(t.number, t.string)
		assert.equal(d.is([1, "yes"]), true)
		assert.equal(d.is([1, "yes", "ignore"]), true)
		assert.equal(d.is([1]), false)
		assert.equal(d.is(["hello"]), false)
		assert.equal(d.toString(), "[number, string]")

		type a1 = Assert<t.Infer<typeof d>, [number, string]> // Infers
		// @ts-expect-error
		t.tuple<[string, string]>(t.number, t.string) // Conforms

		assert.equal(t.formatError(d.validate(9)!), "9 is not an array")
		assert.equal(t.formatError(d.validate([1, 2])!), `[1]: 2 is not a string`)
	})

	it("map", () => {
		const d = t.map(t.number)
		assert.equal(d.is({ a: 1, b: 2 }), true)
		assert.equal(d.is({}), true)
		assert.equal(d.is({ a: 1, b: "hello" }), false)
		assert.equal(d.toString(), "{ [key: string]: number }")
		type a1 = Assert<t.Infer<typeof d>, { [key: string]: number }> // Infers

		// Conforms
		// @ts-expect-error
		const v: t.Validator<{ [key: string]: number | string }> = t.map(t.number)
		const v2: t.Validator<{ [key: string]: number | string }> = t.map(
			t.union(t.number, t.string)
		)
		// @ts-expect-error
		const v3: t.Validator<{ [key: string]: number | string }> = t.map(
			t.union(t.number, t.string, t.boolean)
		)
		assert.equal(t.formatError(d.validate(9)!), "9 is not a map")
		assert.equal(
			t.formatError(d.validate({ a: "b", b: 1 })!),
			`.a: "b" is not a number`
		)
	})

	it("object", () => {
		type User = {
			id: string
			name: string | undefined
			age?: number[]
		}

		const d = t.object({
			id: t.string,
			name: t.union(t.string, t.undefined_),
			age: t.optional(t.array(t.number)),
		})

		assert.equal(d.is({ id: "1" }), true) // Works because not strict.
		assert.equal(d.is({ id: "1", name: "c" }), true)
		assert.equal(d.is({ id: "1", name: undefined }), true)
		assert.equal(d.is({ id: "1", name: undefined, age: [] }), true)
		assert.equal(d.is({ id: "1", name: undefined, age: undefined }), true)
		assert.equal(d.is({ id: "1", name: "hello", age: [12, 23] }), true)
		assert.equal(d.is({ id: "1", name: "hello", c: "ignore" }), true)

		assert.equal(d.is({}), false)
		assert.equal(d.is({ id: "1", name: 2 }), false)

		assert.equal(
			d.toString(),
			"{ id: string; name: string | undefined; age:? Array<number> | undefined }"
		)

		type a1 = Assert<t.Infer<typeof d>, User> // Infers

		// Conforms
		const v1: t.Validator<User> = t.object({
			id: t.string,
			name: t.union(t.string, t.undefined_),
			age: t.optional(t.array(t.number)),
		})

		// @ts-expect-error
		const v2: t.Validator<User> = t.object({
			id: t.string,
			name: t.union(t.string, t.undefined_),
			age: t.union(t.array(t.number)),
		})

		// @ts-expect-error
		const v3: t.Validator<User> = t.object({
			id: t.string,
			name: t.optional(t.string),
			age: t.optional(t.array(t.number)),
		})

		// Conforms
		// NOTE: this ideally would be an error, but it doesnt!
		const v4: t.Validator<User> = t.object({
			id: t.string,
			name: t.union(t.string, t.undefined_),
			// age: t.optional(t.array(t.number)),
		})

		assert.equal(t.formatError(d.validate(9)!), "9 is not an object")
		assert.equal(
			t.formatError(d.validate({})!),
			".id: undefined is not a string"
		)
		assert.equal(
			t.formatError(d.validate({ id: "1", name: 2 })!),
			[
				".name: 2 must satisfy one of:",
				"  2 is not a string",
				"  2 is not undefined",
			].join("\n")
		)
	})

	it("object strict", () => {
		type User = {
			id: string
			name: string | undefined
			age?: number[]
		}

		const d = t.object(
			{
				id: t.string,
				name: t.union(t.string, t.undefined_),
				age: t.optional(t.array(t.number)),
			},
			true
		)

		// Fails because strict.
		assert.equal(d.is({ id: "1" }), false)
		assert.equal(d.is({ id: "1", name: "hello", c: "ignore" }), false)
		assert.equal(
			t.formatError(d.validate({ id: "1", name: "hello", c: "ignore" })!),
			`{"id":"1","name":"hello","c":"ignore"} contains extra keys: "c"`
		)
		assert.equal(
			t.formatError(d.validate({ id: "1" })!),
			`.name: "name" is missing from {"id":"1"}`
		)

		// Other stuff passes normally.
		assert.equal(d.is({ id: "1", name: "c" }), true)
		assert.equal(d.is({ id: "1", name: undefined }), true)
		assert.equal(d.is({ id: "1", name: undefined, age: [] }), true)
		assert.equal(d.is({ id: "1", name: undefined, age: undefined }), true)
		assert.equal(d.is({ id: "1", name: "hello", age: [12, 23] }), true)
	})

	it("any", () => {
		const d = t.any
		assert.equal(d.is(null), true)
		assert.equal(d.is(undefined), true)
		assert.equal(d.is(1), true)
		assert.equal(d.is("hello"), true)
		assert.equal(d.is({}), true)
		assert.equal(d.is([]), true)
		assert.equal(d.toString(), "any")

		type a1 = Assert<t.Infer<typeof d>, any>
		const v1: t.Validator<any> = t.any
		// NOTE: this is a weird exception here about any...
		const v2: t.Validator<any> = t.number
	})

	it("union simple", () => {
		const d = t.union(t.number, t.string)
		assert.equal(d.is(1), true)
		assert.equal(d.is("hello"), true)
		assert.equal(d.is({}), false)
		assert.equal(d.toString(), "number | string")

		type a1 = Assert<t.Infer<typeof d>, number | string> // Infers

		// Conforms
		const v1: t.Validator<string | number> = t.union(t.number, t.string)
		// @ts-expect-error
		const v2: t.Validator<string | number> = t.union(t.string)
		// @ts-expect-error
		const v3: t.Validator<string | number> = t.union(
			t.number,
			t.string,
			t.boolean
		)

		assert.equal(
			t.formatError(d.validate({})!),
			[
				"{} must satisfy one of:",
				"  {} is not a number",
				"  {} is not a string",
			].join("\n")
		)
	})

	it("union object", () => {
		const d = t.union(
			t.object({
				type: t.literal("loading"),
			}),
			t.object({
				type: t.literal("ready"),
				result: t.number,
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
			t.Infer<typeof d>,
			{ type: "loading" } | { type: "ready"; result: number }
		>
		assert.equal(
			t.formatError(d.validate({ type: "ready" })!),
			[
				`{"type":"ready"} must satisfy one of:`,
				`  .type: "ready" is not "loading"`,
				"  .result: undefined is not a number",
			].join("\n")
		)
	})

	describe("Custom types", () => {
		it("number range", () => {
			function range(min: number, max: number) {
				return new t.Validator<number>({
					validate: value =>
						t.number.validate(value) || value < min
							? { message: `${value} is less than ${min}`, path: [] }
							: value > max
							? { message: `${value} is greater than ${max}`, path: [] }
							: undefined,
					inspect: () => `${min} >= number >= ${max}`,
				})
			}

			const d = range(0, 10)
			assert.equal(d.is(0), true)
			assert.equal(d.is(5), true)
			assert.equal(d.is(10), true)
			assert.equal(d.is(-1), false)
			assert.equal(d.is(11), false)

			assert.equal(d.toString(), `0 >= number >= 10`)
			type a1 = Assert<t.Infer<typeof d>, number>

			assert.equal(t.formatError(d.validate(12)!), "12 is greater than 10")
		})
	})

	describe("README", () => {
		it("Infers", () => {
			// Type interence:
			const schema = t.object({
				id: t.string,
				role: t.union(t.literal("admin"), t.literal("member")),
				settings: t.map(t.boolean),
				friends: t.array(t.string),
				rest: t.tuple(t.number, t.string, t.null_, t.undefined_, t.any),
				age: t.optional(t.number),
			})

			type Schema = t.Infer<typeof schema>
			// type Schema = {
			// 	id: string
			// 	role: "admin" | "member"
			// 	settings: {
			// 		[key: string]: boolean
			// 	}
			// 	friends: string[]
			// 	rest: [number, string, null, undefined, any]
			// 	age?: number | undefined
			// }

			schema.is({
				id: "",
				role: "admin",
				settings: {},
				friends: [],
				rest: [1, "", null, undefined, {}],
			})
			// true

			t.formatError(
				schema.validate({
					id: "",
					role: "editor",
					settings: {},
					friends: [],
					rest: [1, "", null, undefined, {}],
				})!
			)
			// .role: "editor" must satisfy one of:
			// 	"editor" is not "admin"
			// 	"editor" is not "member"

			schema.toString()
			// { id: string; role: "admin" | "member"; settings: { [key: string]: boolean }; friends: Array<string>; rest: [number, string, null, undefined, any]; age:? number | undefined }
		})

		it("Conforms", () => {
			type Schema = {
				id: string
				role: "admin" | "member"
				settings: {
					[key: string]: boolean
				}
				friends: string[]
				rest: [number, string, null, undefined, any]
				age?: number | undefined
			}

			// Type conformation:
			// @ts-expect-error
			const schema: t.Validator<Schema> = t.object({
				id: t.string,
				role: t.union(
					t.literal("admin"),
					t.literal("member"),
					t.literal("editor")
				),
				settings: t.map(t.boolean),
				friends: t.array(t.string),
				rest: t.tuple(t.number, t.string, t.null_, t.undefined_, t.any),
				age: t.optional(t.number),
			})
		})
	})
})
