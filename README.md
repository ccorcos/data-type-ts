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

You can also create your own custom validators.