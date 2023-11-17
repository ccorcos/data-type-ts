# Data Types for TypeScript

Runtime validators with TypeScript.

## Getting Started

```sh
npm install --save data-type-ts
```

You can define types at runtime that are correctly inferred by TypeScript.

```ts
import * as dt from "data-type-ts"

// Define runtime validator.
const response = dt.union(
	dt.object({
		type: dt.literal("loading"),
	}),
	dt.object({
		type: dt.literal("ready"),
		result: dt.number,
	})
)
// const response: dt.Validator<
// 	| {
// 			type: "loading"
// 	  }
// 	| {
// 			type: "ready"
// 			result: number
// 	  }
// >

// You can extract the type:
type Response = typeof response.value
// type Response =
// 	| {
// 			type: "loading"
// 	  }
// 	| {
// 			type: "ready"
// 			result: number
// 	  }
```

Then you can use this for runtime validation:

```ts
response.is({ type: "ready", result: 12 })
// true

response.is({ type: "ready" })
// false
```

Use can also generate user-friendly errors.

```ts
response.validate({ type: "ready", result: 12 })
// undefined

dt.formatError(response.validate({ type: "ready" }))
// {"type":"ready"} must satisfy one of:
//   .type: "ready" is not "loading"
//   .result: undefined is not a number
```

You can also inspect the validator which is convenient for debugging:

```ts
response.toString()
// { type: "loading" } | { type: "ready"; result: number }
```

For validating objects, you can pass a second argument "strict" if you want to error when there are extra keys.

```ts
const d = dt.object({
	a: dt.number,
	b: dt.optional(dt.string),
}, true)

d.is({ a: 1, b: "hello", c: "extra" })
// false

dt.formatError(d.validate({ a: 1, b: "hello", c: "extra" }))
// `{"a":1,"b":"hello","c":"extra"} contains extra keys: "c"`
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