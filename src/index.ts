import * as _ from "lodash"

export type NullDataType = { type: "null" }

export type UndefinedDataType = { type: "undefined" }

export type StringDataType = { type: "string" }

export type NumberDataType = { type: "number" }

export type BooleanDataType = { type: "boolean" }

export type LiteralDataType = {
	type: "literal"
	value: string | number | boolean
}

export type ArrayDataType = { type: "array"; inner: DataType }

export type TupleDataType = { type: "tuple"; values: Array<DataType> }

export type MapDataType = { type: "map"; inner: DataType }

export type ObjectDataType = {
	type: "object"
	required: { [key: string]: DataType }
	optional: { [key: string]: DataType }
}

export type AnyDataType = { type: "any" }

export type OrDataType = { type: "or"; values: Array<DataType> }

/** This is how DataTypes are serialized. */
export type DataType =
	| NullDataType
	| UndefinedDataType
	| StringDataType
	| NumberDataType
	| BooleanDataType
	| LiteralDataType
	| ArrayDataType
	| TupleDataType
	| MapDataType
	| ObjectDataType
	| AnyDataType
	| OrDataType

type DataTypeMap = { [K in DataType["type"]]: Extract<DataType, { type: K }> }

type ValidateError = {
	error: string
	path: Array<number | string>
	children?: Array<ValidateError>
}

type IsDataTypeMap = {
	[K in keyof DataTypeMap]: (
		dataType: DataTypeMap[K],
		value: unknown
	) => ValidateError | undefined
}

/** A map of DataType.type to validator functions. */
const isDataTypeMap: IsDataTypeMap = {
	undefined: (dataType, value) => {
		if (value !== undefined) {
			return {
				error: `${JSON.stringify(value)} is not undefined`,
				path: [],
			}
		}
	},
	null: (dataType, value) => {
		if (value !== null) {
			return {
				error: `${JSON.stringify(value)} is not null`,
				path: [],
			}
		}
	},
	string: (dataType, value) => {
		if (!_.isString(value)) {
			return {
				error: `${JSON.stringify(value)} is not a string`,
				path: [],
			}
		}
	},
	number: (dataType, value) => {
		if (!_.isNumber(value)) {
			return {
				error: `${JSON.stringify(value)} is not a number`,
				path: [],
			}
		}
	},
	boolean: (dataType, value) => {
		if (!_.isBoolean(value)) {
			return {
				error: `${JSON.stringify(value)} is not a boolean`,
				path: [],
			}
		}
	},
	literal: (dataType, value) => {
		if (!_.isEqual(value, dataType.value)) {
			return {
				error: `${JSON.stringify(value)} is not literally ${JSON.stringify(
					dataType.value
				)}`,
				path: [],
			}
		}
	},
	array: (dataType, value) => {
		if (!Array.isArray(value)) {
			return {
				error: `${JSON.stringify(value)} is not a array`,
				path: [],
			}
		}
		for (let i = 0; i < value.length; i++) {
			const error = validateDataType(dataType.inner, value[i])
			if (error) {
				return {
					...error,
					path: [i, ...error.path],
				}
			}
		}
	},
	tuple: (dataType, value) => {
		if (!Array.isArray(value)) {
			return {
				error: `${JSON.stringify(value)} is not a array`,
				path: [],
			}
		}
		for (let i = 0; i < dataType.values.length; i++) {
			const error = validateDataType(dataType.values[i], value[i])
			if (error) {
				return {
					...error,
					path: [i, ...error.path],
				}
			}
		}
	},
	map: (dataType, value) => {
		if (!isPlainObject(value)) {
			return {
				error: `${JSON.stringify(value)} is not a map`,
				path: [],
			}
		}
		for (const key in value) {
			const error = validateDataType(dataType.inner, value[key])
			if (error) {
				return {
					...error,
					path: [key, ...error.path],
				}
			}
		}
	},
	object: (dataType, value) => {
		if (!isPlainObject(value)) {
			return {
				error: `${JSON.stringify(value)} is not an object`,
				path: [],
			}
		}
		for (const key in dataType.required) {
			const error = validateDataType(dataType.required[key], value[key])
			if (error) {
				return {
					...error,
					path: [key, ...error.path],
				}
			}
		}
		for (const key in dataType.optional) {
			if (key in value && value[key] !== undefined) {
				const error = validateDataType(dataType.optional[key], value[key])
				if (error) {
					return {
						...error,
						path: [key, ...error.path],
					}
				}
			}
		}
	},
	any: (dataType, value) => undefined,
	or: (dataType, value) => {
		const errors = _.compact(
			dataType.values.map(possibleDataType => {
				return validateDataType(possibleDataType, value)
			})
		)
		if (errors.length === dataType.values.length) {
			// TODO: find discriminating keys so we can report just one message.
			return {
				error: `${JSON.stringify(value)} does not match one of:`,
				path: [],
				children: errors,
			}
		}
	},
}

/** Runtime validation for DataTypes. */
export function validateDataType<T extends DataType>(
	dataType: T,
	value: unknown
) {
	const validate = isDataTypeMap[dataType.type] as (
		schema: DataType,
		value: unknown
	) => { error: string; path: Array<string | number> } | undefined
	return validate(dataType, value)
}

export function dataTypeIs<T extends DataType>(dataType: T, value: unknown) {
	return validateDataType(dataType, value) === undefined
}

type ToStringDataTypeMap = {
	[K in keyof DataTypeMap]: (dataType: DataTypeMap[K]) => string
}

/** A map of DataType.type to validator functions. */
const toStringDataTypeMap: ToStringDataTypeMap = {
	null: dataType => "null",
	undefined: dataType => "undefined",
	string: dataType => "string",
	number: dataType => "number",
	boolean: dataType => "boolean",
	literal: dataType => JSON.stringify(dataType.type),
	array: dataType => "Array<" + dataTypeToString(dataType.inner) + ">",
	tuple: dataType =>
		"[" + dataType.values.map(dataTypeToString).join(", ") + "]",
	map: dataType => "{[key: string]: " + dataTypeToString(dataType.inner) + "}",
	object: dataType =>
		"{" +
		[
			...Object.keys(dataType.required).map(key => {
				return key + ": " + dataTypeToString(dataType.required[key])
			}),
			...Object.keys(dataType.optional).map(key => {
				return key + ":? " + dataTypeToString(dataType.required[key])
			}),
		].join(", ") +
		"}",
	any: dataType => "any",
	or: dataType => dataType.values.map(dataTypeToString).join(" | "),
}

export function dataTypeToString(dataType: DataType) {
	const toString = toStringDataTypeMap[dataType.type]
	return toString(dataType as any)
}

/**
 * A runtime representation of a DataType that is serializable with runtime validation
 * as well as TypeScript types available with `typeof DataType.value`.
 */
export class RuntimeDataType<T> {
	value: T
	dataType: DataType
	constructor(dataType: DataType) {
		this.dataType = dataType
	}
	/** Convenient wrapper for `isDataType`. */
	is(value: unknown): value is T {
		return validateDataType(this.dataType, value) === undefined
	}
	validate(value: unknown): ValidateError | undefined {
		return validateDataType(this.dataType, value)
	}
	toJSON() {
		return this.dataType
	}
}

// Runtime representations of each DataType.

export const null_ = new RuntimeDataType<null>({ type: "null" })

export const undefined_ = new RuntimeDataType<undefined>({ type: "undefined" })

export const string = new RuntimeDataType<string>({ type: "string" })

export const number = new RuntimeDataType<number>({ type: "number" })

export const boolean = new RuntimeDataType<boolean>({ type: "boolean" })

export function literal<T extends string | number | boolean>(x: T) {
	return new RuntimeDataType<T>({ type: "literal", value: x })
}

export function array<T>(inner: RuntimeDataType<T>) {
	return new RuntimeDataType<Array<T>>({
		type: "array",
		inner: inner.dataType,
	})
}

// Apparently there's a special case in TypeScript for mapping over tuples.
// https://github.com/Microsoft/TypeScript/issues/25947#issuecomment-407930249
export function tuple<T extends Array<any>>(...values: T) {
	return new RuntimeDataType<{ [K in keyof T]: RuntimeDataType<T[K]> }>({
		type: "tuple",
		values: values.map(value => value.dataType),
	})
}

export function map<T>(inner: RuntimeDataType<T>) {
	return new RuntimeDataType<{ [key: string]: T }>({
		type: "map",
		inner: inner.dataType,
	})
}

export function object<
	O extends { [K in keyof RequiredSchema]: RequiredSchema[K]["value"] } &
		{ [K in keyof OptionalSchema]?: OptionalSchema[K]["value"] },
	// Rip out the required properties
	RequiredSchema extends { [K: string]: RuntimeDataType<unknown> } = {
		[K in {
			[K in keyof O]: Pick<O, K> extends Required<Pick<O, K>> ? K : never
		}[keyof O]]: RuntimeDataType<O[K]>
	},
	// Rip out the optional properties
	OptionalSchema extends { [K: string]: RuntimeDataType<unknown> } = {
		[K in {
			[K in keyof O]: Partial<Pick<O, K>> extends Pick<O, K> ? K : never
		}[keyof O]]: RuntimeDataType<O[K]>
	}
>(args: { required: RequiredSchema; optional: OptionalSchema }) {
	const required: { [key: string]: DataType } = {}
	const optional: { [key: string]: DataType } = {}
	for (const key in args.required) {
		required[key] = args.required[key].dataType
	}
	for (const key in args.optional) {
		optional[key] = args.optional[key].dataType
	}
	/**
	 * To support optional with optimal developer UX:
	 * 1. If no value is optional then make all keys required.
	 * 2. Else if no value is required then make all keys optional.
	 * 3. Else make an intersection of an object of required keys and
	 *    an object of optional keys.
	 */

	return new RuntimeDataType<
		{} extends OptionalSchema
			? {
					// If there are no optionals, return a cleaner schema.
					[K in keyof O]: O[K]
			  }
			: {} extends RequiredSchema
			? {
					// If there are not required, return a cleaner schema
					[K in keyof O]?: O[K]
			  }
			: O
	>({
		type: "object",
		required: required,
		optional: optional,
	})
}

export const any = new RuntimeDataType<any>({ type: "any" })

export function or<T extends Array<RuntimeDataType<any>>>(...values: T) {
	return new RuntimeDataType<T[number]["value"]>({
		type: "or",
		values: values.map(value => value.dataType),
	})
}

// We're going to mutate this array to avoid circular references.
const dataTypeDataTypeValues: Array<any> = []

/** RuntimeDataTypes for DataTypes. Very Meta 🤯 */
export const dataTypeDataType = new RuntimeDataType<DataType>({
	type: "or",
	values: dataTypeDataTypeValues,
})

export const nullDataType = object({
	required: { type: literal("null") },
	optional: {},
})

export const undefinedDataType = object({
	required: { type: literal("undefined") },
	optional: {},
})

export const stringDataType = object({
	required: { type: literal("string") },
	optional: {},
})

export const numberDataType = object({
	required: { type: literal("number") },
	optional: {},
})

export const booleanDataType = object({
	required: { type: literal("boolean") },
	optional: {},
})

export const literalDataType = object({
	required: {
		type: literal("literal"),
		value: or(string, number, boolean),
	},
	optional: {},
})

export const arrayDataType = object({
	required: {
		type: literal("array"),
		inner: dataTypeDataType,
	},
	optional: {},
})

export const tupleDataType = object({
	required: {
		type: literal("tuple"),
		values: array(dataTypeDataType),
	},
	optional: {},
})

export const mapDataType = object({
	required: {
		type: literal("map"),
		inner: dataTypeDataType,
	},
	optional: {},
})

export const objectDataType = object({
	required: {
		type: literal("object"),
		required: map(dataTypeDataType),
		optional: map(dataTypeDataType),
	},
	optional: {},
})

export const anyDataType = object({
	required: { type: literal("any") },
	optional: {},
})

export const orDataType = object({
	required: {
		type: literal("or"),
		values: array(dataTypeDataType),
	},
	optional: {},
})

// Specify all runtime type parameters
const runtimeDataTypeMap: {
	[K in keyof DataTypeMap]: RuntimeDataType<DataTypeMap[K]>
} = {
	null: nullDataType,
	undefined: undefinedDataType,
	string: stringDataType,
	number: numberDataType,
	boolean: booleanDataType,
	literal: literalDataType,
	array: arrayDataType,
	tuple: tupleDataType,
	map: mapDataType,
	object: objectDataType,
	any: anyDataType,
	or: orDataType,
}

// Type contrained :)
dataTypeDataTypeValues.push(
	...Object.values(runtimeDataTypeMap).map(
		runtimeDataType => runtimeDataType.dataType
	)
)

function isPlainObject(obj: unknown): obj is object {
	return _.isPlainObject(obj)
}
