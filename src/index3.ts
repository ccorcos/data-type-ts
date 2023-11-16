import compact from "lodash/compact"
import isBoolean from "lodash/isBoolean"
import isEqual from "lodash/isEqual"
import isNumber from "lodash/isNumber"
import isPlainObject_ from "lodash/isPlainObject"
import isString from "lodash/isString"

// const toStringDataTypeMap: ToStringDataTypeMap = {
// 	null: dataType => "null",
// 	undefined: dataType => "undefined",
// 	string: dataType => "string",
// 	number: dataType => "number",
// 	boolean: dataType => "boolean",
// 	literal: dataType => JSON.stringify(dataType.value),
// 	array: dataType => "Array<" + dataTypeToString(dataType.inner) + ">",
// 	tuple: dataType =>
// 		"[" + dataType.values.map(dataTypeToString).join(", ") + "]",
// 	map: dataType =>
// 		"{ [key: string]: " + dataTypeToString(dataType.inner) + " }",
// 	object: dataType =>
// 		"{ " +
// 		[
// 			...Object.keys(dataType.required).map(key => {
// 				return key + ": " + dataTypeToString(dataType.required[key])
// 			}),
// 			...Object.keys(dataType.optional).map(key => {
// 				return key + "?: " + dataTypeToString(dataType.optional[key])
// 			}),
// 		].join("; ") +
// 		" }",
// 	any: dataType => "any",
// 	or: dataType => dataType.values.map(dataTypeToString).join(" | "),
// }

type ValidateError = {
	message: string
	path: Array<number | string>
	children?: Array<ValidateError>
}

class Validator<T> {
	constructor(public validate: (value: T) => ValidateError | undefined) {}
	public is(value: unknown): value is T {
		return this.validate(value as any) === undefined
	}
	public value: T
}

export const undefined_ = new Validator<undefined>(value => {
	if (value !== undefined) {
		return {
			message: `${JSON.stringify(value)} is not undefined`,
			path: [],
		}
	}
})

export const null_ = new Validator<null>(value => {
	if (value !== null) {
		return {
			message: `${JSON.stringify(value)} is not null`,
			path: [],
		}
	}
})

export const string = new Validator<string>(value => {
	if (!isString(value)) {
		return {
			message: `${JSON.stringify(value)} is not a string`,
			path: [],
		}
	}
})

export const number = new Validator<number>(value => {
	if (!isNumber(value)) {
		return {
			message: `${JSON.stringify(value)} is not a number`,
			path: [],
		}
	}
})

export const boolean = new Validator<boolean>(value => {
	if (!isBoolean(value)) {
		return {
			message: `${JSON.stringify(value)} is not a boolean`,
			path: [],
		}
	}
})

export function literal<T extends string | number | boolean>(inner: T) {
	return new Validator<T>(value => {
		if (!isEqual(value, inner)) {
			return {
				message: `${JSON.stringify(value)} is not ${JSON.stringify(inner)}`,
				path: [],
			}
		}
	})
}

export function array<T>(validator: Validator<T>) {
	return new Validator<Array<T>>(value => {
		if (!Array.isArray(value)) {
			return {
				message: `${JSON.stringify(value)} is not an array`,
				path: [],
			}
		}
		for (let i = 0; i < value.length; i++) {
			const error = validator.validate(value[i])
			if (error) {
				return {
					...error,
					path: [i, ...error.path],
				}
			}
		}
	})
}

// Apparently there's a special case in TypeScript for mapping over tuples.
// https://github.com/Microsoft/TypeScript/issues/25947#issuecomment-407930249
export function tuple<T extends Array<any>>(
	...validators: {
		[K in keyof T]: Validator<T[K]>
	}
) {
	return new Validator<T>(value => {
		if (!Array.isArray(value)) {
			return {
				message: `${JSON.stringify(value)} is not an array`,
				path: [],
			}
		}
		for (let i = 0; i < validators.length; i++) {
			const error = validators[i].validate(value[i])
			if (error) {
				return {
					...error,
					path: [i, ...error.path],
				}
			}
		}
	})
}

export function map<T>(inner: Validator<T>) {
	return new Validator<{ [key: string]: T }>(value => {
		if (!isPlainObject(value)) {
			return {
				message: `${JSON.stringify(value)} is not a map`,
				path: [],
			}
		}
		for (const key in value) {
			const error = inner.validate(value[key])
			if (error) {
				return {
					...error,
					path: [key, ...error.path],
				}
			}
		}
	})
}

export function object<T extends object>(args: {
	[K in keyof T]: Validator<T[K]>
}) {
	return new Validator<T>(value => {
		if (!isPlainObject(value)) {
			return {
				message: `${JSON.stringify(value)} is not an object`,
				path: [],
			}
		}
		for (const key in args) {
			const error = args[key].validate(value[key])
			if (error) {
				return {
					...error,
					path: [key, ...error.path],
				}
			}
		}
	})
}

export const any = new Validator<any>(value => undefined)

/** This is the only one that doesn't infer well. Generic type is an array. */
export function union<T extends Validator<any>[]>(...values: T) {
	return new Validator<T[number]["value"]>(value => {
		const errors = compact(
			values.map(possibleValidator => {
				return possibleValidator.validate(value)
			})
		)
		if (errors.length === values.length) {
			// TODO: find discriminating keys so we can report just one message.
			return {
				message: `${JSON.stringify(value)} must satisfy one of:`,
				path: [],
				children: errors,
			}
		}
	})
}

function isPlainObject(obj: unknown): obj is object {
	return isPlainObject_(obj)
}

function pathToString(path: Array<string | number>) {
	return path
		.map(item => {
			if (isNumber(item)) {
				return `[${item}]`
			}
			if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(item)) {
				return `.${item}`
			}
			return `[${JSON.stringify(item)}]`
		})
		.join("")
}

function indent(str: string) {
	return "  " + str.split("\n").join("\n  ")
}

export function formatError(error: ValidateError) {
	let str = ""
	if (error.path.length) {
		str += pathToString(error.path)
		str += ": "
	}
	str += error.message
	if (error.children) {
		str += "\n"
		str += indent(error.children.map(formatError).join("\n"))
	}
	return str
}
