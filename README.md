# Data Types for TypeScript

This project aims to unify TypeScript type, runtime validators, and serializable JSON schemas.

## Getting Started

```sh
npm install --save data-type-ts
```

You can define types at runtime that are correctly inferred by TypeScript.

```ts
import * as dt from "data-type-ts"

const demoType = dt.object({
	required: {
		hello: dt.literal("world"),
		value: dt.or(dt.number, dt.string),
	},
	optional: {},
})
// const demoType: dt.RuntimeDataType<{
//     hello: "world";
//     value: string | number;
// }>

type Demo = typeof demoType.value
// type Demo = {
//     hello: "world";
//     value: string | number;
// }
```

Use `RuntimeDataType.is` to validate data:

```ts
demoType.is({ hello: "world", value: 12 })
// true

demoType.is({ hello: "word", value: 12 })
// false
```

Use `RuntimeDataType.validate` to generate user-friendly errors.

```ts
demoType.validate({ hello: "world", value: 12 })
// undefined

demoType.validate({ hello: "word", value: 12 })
// { error: '"word" is not literally "world"', path: ["hello"] }
```

You can serialize these schemas if you want to be able to dynamically modify them. However, TypeScript can only infer types that are statically defined so once you read the schema back from disk and load it up, the inferred type will be unknown.

```ts
demoType.toJSON()
// {
// 	type: "object",
// 	required: {
// 		hello: {
// 			type: "literal",
// 			value: "world",
// 		},
// 		value: {
// 			type: "or",
// 			values: [
// 				{
// 					type: "number",
// 				},
// 				{
// 					type: "string",
// 				},
// 			],
// 		},
// 	},
// 	optional: {},
// }

const unknownType = new dt.RuntimeDataType(demoType.toJSON())
// const unknownType: dt.RuntimeDataType<unknown>
```

Lastly, `RunTimeDataType.toString()` will generate a TypeScript representation of the data type so you can easily inspect what the type represents.

```ts
demoType.toString()
// { hello: "world"; value: number | string }
```
