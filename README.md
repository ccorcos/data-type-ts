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

type Schema = (typeof schema)["value"]
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

This library is only meant to support the most basic JSON types. But you can extend this for your own validators as well.

```ts
import * as emailValidator from "email-validator"

export const email = new Validator<string>({
	validate: value => {
		const invalidString = string.validate(value)
		if (invalidString) return invalidString

		const validEmail = emailValidator.validate(email)
		if (!validEmail)
			return {
				message: `${JSON.stringify(value)} is not valid email`,
				path: [],
			}
	},
	inspect: () => "Email",
})
```

## Using for Validation only

Personally, I find it kind of gross to construct types using a runtime wrapper like this. Not to mention, there's all kinds of basic validation that you might want to keep our of your types to keep them clean.

So if you're just using for validation, you can pass the types into your schema in order to assert that your schema conforms to the type.

```ts


```