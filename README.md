# Runtime Data Types for TypeScript

## Getting Started

```sh
npm install --save data-type-ts
```

You can define types at runtime that are correctly inferred by TypeScript.

```ts
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
```

You can validate values with useful error messages:

```ts
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
```

If you prefer to define your types normally and only use this library for validation, you can still get typesafety this way:

```ts
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
const schema: t.Validator<Schema> = t.object({
	id: t.string,
	role: t.union(
		t.literal("admin"),
		t.literal("member"),
		t.literal("editor") // This should make an error.
	),
	settings: t.map(t.boolean),
	friends: t.array(t.string),
	rest: t.tuple(t.number, t.string, t.null_, t.undefined_, t.any),
	age: t.optional(t.number),
})
```

There are two gotchas with this approach though:

1. The type errors are pretty hard to interpret when things aren't lined up.
2. This approach does not catch missing optional types for fundamental TypeScript reasons.

	```ts
	const schema: t.Validator<Schema>  = t.object({
		id: t.string,
		role: t.union(t.literal("admin"), t.literal("member")),
		settings: t.map(t.boolean),
		friends: t.array(t.string),
		rest: t.tuple(t.number, t.string, t.null_, t.undefined_, t.any),
		// age: t.optional(t.number), // This should throw and error but it doesnt!
	})
	```

## Custom Types

This library only supports the most basic JSON types but you can extend it with your own custom validators:

```ts
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

import * as emailValidator from "email-validator"

export const email = new t.Validator<string>({
	validate: value =>
		t.string.validate(value) || !emailValidator.validate(email)
			? { message: `${JSON.stringify(value)} is not valid email` }
			: undefined,
	inspect: () => "Email",
})

const schema = t.object({
	id: t.string,
	email: email,
	score: range(0, 10)
})

console.log(schema.toString())
// {
// 	id: string,
// 	email: Email
// 	score: 0 >= number >= 10
// }
```

Note that the `inspect` argument is optional but it's is helpful for debugging.

Something I like to do is create a "dataTypes.ts" file to export everything I need.

```ts
import * as t from "data-type-ts"
export * from "data-type-ts"

export const uuid = new t.Validator<string>({
	validate: (value) =>
		t.string.validate(value) ||
		!value.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
			? { message: `${JSON.stringify(value)} is not a valid UUID.` }
			: undefined,
	inspect: () => "UUID",
})

export const datetime = new t.Validator<string>({
	validate: (value) =>
		t.string.validate(value) || !value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
			? { message: `${JSON.stringify(value)} is not a valid ISO 8601 datetime string.` }
			: undefined,
	inspect: () => "Datetime",
})
```